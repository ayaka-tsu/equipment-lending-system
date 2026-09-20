/**
 * 主要な一覧・集計クエリの応答時間を測る（NFR-P-01 の確認用）。
 *
 *   npm run db:perf        # 性能検証用データを入れる
 *   npm run perf:measure   # 10回ずつ実行して中央値と最大値を出す
 *
 * 基準：参照系は 500ms 以内（NFR-P-01）。
 * ここで測るのは SQL の実行時間で、API 全体の応答時間はこれに Next.js の処理が乗る。
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, Prisma } from "@/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const RUNS = Number(process.env.PERF_RUNS ?? 10);
const LIMIT = 20;

const queries: { name: string; sql: Prisma.Sql }[] = [
  {
    name: "備品一覧（キーワード検索＋貸出可能数）",
    sql: Prisma.sql`
      SELECT e.id, e.asset_code, e.name, c.name AS category,
             e.quantity - COALESCE(a.active_count, 0) AS available_quantity
      FROM equipment e
      JOIN categories c ON c.id = e.category_id
      LEFT JOIN (
        SELECT equipment_id, COUNT(*) AS active_count
        FROM loans
        WHERE status IN ('pending', 'approved', 'lent')
        GROUP BY equipment_id
      ) a ON a.equipment_id = e.id
      WHERE e.deleted_at IS NULL
        AND (e.name ILIKE '%備品%' OR e.asset_code ILIKE '%備品%')
      ORDER BY e.asset_code
      LIMIT ${LIMIT} OFFSET 0`,
  },
  {
    name: "備品一覧の件数",
    sql: Prisma.sql`
      SELECT COUNT(*) FROM equipment e
      WHERE e.deleted_at IS NULL
        AND (e.name ILIKE '%備品%' OR e.asset_code ILIKE '%備品%')`,
  },
  {
    name: "申請・貸出管理一覧（延滞のみ）",
    sql: Prisma.sql`
      SELECT l.id, l.status, l.due_date, u.name AS borrower, e.asset_code, e.name
      FROM loans l
      JOIN users u ON u.id = l.borrower_id
      JOIN equipment e ON e.id = l.equipment_id
      WHERE l.status = 'lent'
        AND l.due_date < (now() AT TIME ZONE 'Asia/Tokyo')::date
      ORDER BY l.due_date ASC, l.id ASC
      LIMIT ${LIMIT} OFFSET 0`,
  },
  {
    name: "自分の申請一覧",
    sql: Prisma.sql`
      SELECT l.id, l.status, l.due_date, e.asset_code, e.name
      FROM loans l
      JOIN equipment e ON e.id = l.equipment_id
      WHERE l.borrower_id = (SELECT id FROM users ORDER BY id LIMIT 1)
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT ${LIMIT} OFFSET 0`,
  },
  {
    name: "ダッシュボードの件数集計",
    sql: Prisma.sql`
      SELECT status, COUNT(*) FROM loans GROUP BY status`,
  },
  {
    name: "ダッシュボードのカテゴリ別集計",
    sql: Prisma.sql`
      SELECT c.id, c.name,
             COALESCE(SUM(e.quantity), 0) AS total_quantity,
             COUNT(l.id) FILTER (WHERE l.status = 'lent') AS lent_count
      FROM categories c
      LEFT JOIN equipment e ON e.category_id = c.id AND e.deleted_at IS NULL
      LEFT JOIN loans l ON l.equipment_id = e.id
      GROUP BY c.id, c.name
      ORDER BY c.sort_order`,
  },
  {
    name: "操作履歴一覧（期間絞り込み）",
    sql: Prisma.sql`
      SELECT a.id, a.action, a.created_at, u.name AS actor
      FROM audit_logs a
      JOIN users u ON u.id = a.actor_id
      WHERE a.created_at >= now() - interval '90 days'
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT ${LIMIT} OFFSET 0`,
  },
];

async function main() {
  const counts = {
    equipment: await prisma.equipment.count(),
    loans: await prisma.loan.count(),
    auditLogs: await prisma.auditLog.count(),
  };
  console.log(
    `データ件数: 備品 ${counts.equipment} / 申請 ${counts.loans} / 操作履歴 ${counts.auditLogs}`,
  );
  console.log(`各クエリを ${RUNS} 回実行します（基準: 500ms 以内）\n`);

  let failed = 0;
  for (const q of queries) {
    const times: number[] = [];
    for (let i = 0; i < RUNS; i++) {
      const start = performance.now();
      await prisma.$queryRaw(q.sql);
      times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    const median = times[Math.floor(times.length / 2)];
    const max = times[times.length - 1];
    const ok = max < 500;
    if (!ok) failed++;
    console.log(
      `${ok ? "OK  " : "NG  "} ${q.name}  中央値 ${median.toFixed(1)}ms / 最大 ${max.toFixed(1)}ms`,
    );
  }
  console.log(`\n基準を超えたクエリ: ${failed} 件`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
