/**
 * 性能検証用データの生成（NFR-T-03）。
 *
 *   npm run db:perf            # 備品1,000件・申請20,000件・操作履歴70,000件
 *   npm run db:perf -- --clean # 生成したデータだけを削除する
 *
 * 5年後の想定（備品1,000件・申請15,000件・操作履歴65,000件）を上回る量を入れて、
 * NFR-P-01（参照系 API 500ms 以内、更新系 1秒以内）を確認するために使う。
 *
 * 通常のシード（prisma/seed.ts）のデータとは分けて扱えるように、
 * 生成するデータには専用の接頭辞を付けている。
 *   備品の管理番号：PF-0001〜  ／  社員番号：E9001〜
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "@/generated/prisma/client";
import { addDaysToDateString, todayInJst } from "@/lib/date";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const EQUIPMENT_COUNT = Number(process.env.PERF_EQUIPMENT ?? 1000);
const LOAN_COUNT = Number(process.env.PERF_LOANS ?? 20000);
const AUDIT_LOG_COUNT = Number(process.env.PERF_AUDIT_LOGS ?? 70000);
const USER_COUNT = Number(process.env.PERF_USERS ?? 150);
const BATCH = 1000;

const ASSET_PREFIX = "PF-";
const EMPLOYEE_PREFIX = "E9";

const day = (offset: number) => new Date(`${addDaysToDateString(todayInJst(), offset)}T00:00:00Z`);
const at = (offset: number) => new Date(`${addDaysToDateString(todayInJst(), offset)}T01:00:00Z`);
const pick = <T>(items: T[], i: number) => items[i % items.length];

async function clean() {
  const equipment = await prisma.equipment.findMany({
    where: { assetCode: { startsWith: ASSET_PREFIX } },
    select: { id: true },
  });
  const users = await prisma.user.findMany({
    where: { employeeCode: { startsWith: EMPLOYEE_PREFIX } },
    select: { id: true },
  });
  const equipmentIds = equipment.map((e) => e.id);
  const userIds = users.map((u) => u.id);

  const loans = await prisma.loan.findMany({
    where: { OR: [{ equipmentId: { in: equipmentIds } }, { borrowerId: { in: userIds } }] },
    select: { id: true },
  });
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { targetType: "loan", targetId: { in: loans.map((l) => l.id) } },
        { targetType: "equipment", targetId: { in: equipmentIds } },
        { actorId: { in: userIds } },
      ],
    },
  });
  await prisma.loan.deleteMany({ where: { id: { in: loans.map((l) => l.id) } } });
  await prisma.equipment.deleteMany({ where: { id: { in: equipmentIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  console.log("性能検証用データを削除しました:", {
    equipment: equipmentIds.length,
    users: userIds.length,
    loans: loans.length,
  });
}

async function generate() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  if (categories.length === 0) {
    throw new Error("カテゴリがありません。先に npm run db:seed を実行してください。");
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.createMany({
    data: Array.from({ length: USER_COUNT }, (_, i) => ({
      employeeCode: `${EMPLOYEE_PREFIX}${String(i + 1).padStart(3, "0")}`,
      name: `性能検証 社員${i + 1}`,
      email: `perf${i + 1}@example.com`,
      department: pick(["開発部", "営業部", "管理部", "総務部"], i),
      role: "member",
      passwordHash,
    })),
    skipDuplicates: true,
  });

  await prisma.equipment.createMany({
    data: Array.from({ length: EQUIPMENT_COUNT }, (_, i) => ({
      assetCode: `${ASSET_PREFIX}${String(i + 1).padStart(4, "0")}`,
      name: `性能検証用備品 ${i + 1}`,
      categoryId: pick(categories, i).id,
      quantity: (i % 5) + 1,
      storageLocation: pick(["本社3F 総務キャビネット", "本社3F 書棚A", "本社2F 倉庫"], i),
      description: i % 3 === 0 ? "性能検証用に自動生成した備品" : null,
      status: i % 50 === 0 ? "suspended" : "active",
    })),
    skipDuplicates: true,
  });

  const users = await prisma.user.findMany({
    where: { employeeCode: { startsWith: EMPLOYEE_PREFIX } },
    select: { id: true },
  });
  const equipment = await prisma.equipment.findMany({
    where: { assetCode: { startsWith: ASSET_PREFIX } },
    select: { id: true },
  });

  // 未完了（pending/approved/lent）の申請は「同じ備品 × 同じ社員」で1件までという
  // 部分ユニークインデックス（BR-04）があるため、組み合わせが重複しないように作る。
  const activeCount = Math.min(Math.floor(LOAN_COUNT * 0.1), equipment.length);
  let created = 0;
  for (let start = 0; start < LOAN_COUNT; start += BATCH) {
    const rows = [];
    for (let i = start; i < Math.min(start + BATCH, LOAN_COUNT); i++) {
      const isActive = i < activeCount;
      const equipmentId = isActive ? equipment[i].id : pick(equipment, i * 7).id;
      const borrowerId = isActive ? pick(users, i).id : pick(users, i * 3).id;
      const status = isActive
        ? pick(["pending", "approved", "lent", "lent"], i)
        : pick(["returned", "returned", "returned", "rejected", "cancelled"], i);
      const createdDays = -((i % 1800) + 1);
      const dueDays = isActive ? (i % 30) - 3 : createdDays + 14;
      rows.push({
        equipmentId,
        borrowerId,
        status,
        purpose: `性能検証用の申請 ${i + 1}`,
        dueDate: day(dueDays),
        reviewedBy: status === "pending" ? null : pick(users, i + 1).id,
        reviewedAt: status === "pending" ? null : at(createdDays + 1),
        rejectReason: status === "rejected" ? "性能検証用のため" : null,
        lentAt: status === "lent" || status === "returned" ? at(createdDays + 2) : null,
        returnedAt: status === "returned" ? at(createdDays + 10) : null,
        cancelledBy: status === "cancelled" ? borrowerId : null,
        cancelledAt: status === "cancelled" ? at(createdDays + 1) : null,
        createdAt: at(createdDays),
        updatedAt: at(createdDays),
      });
    }
    const result = await prisma.loan.createMany({ data: rows, skipDuplicates: true });
    created += result.count;
  }

  const loans = await prisma.loan.findMany({
    where: { purpose: { startsWith: "性能検証用の申請" } },
    select: { id: true },
  });
  const actions = ["loan.request", "loan.approve", "loan.lend", "loan.return", "loan.cancel"];
  for (let start = 0; start < AUDIT_LOG_COUNT; start += BATCH) {
    const rows = [];
    for (let i = start; i < Math.min(start + BATCH, AUDIT_LOG_COUNT); i++) {
      const loan = pick(loans, i);
      rows.push({
        actorId: pick(users, i).id,
        action: pick(actions, i),
        targetType: "loan",
        targetId: loan.id,
        detail: {
          equipmentAssetCode: `${ASSET_PREFIX}${String((i % EQUIPMENT_COUNT) + 1).padStart(4, "0")}`,
          equipmentName: `性能検証用備品 ${(i % EQUIPMENT_COUNT) + 1}`,
          borrowerName: `性能検証 社員${(i % USER_COUNT) + 1}`,
        },
        createdAt: at(-((i % 1800) + 1)),
      });
    }
    await prisma.auditLog.createMany({ data: rows });
  }

  console.log("性能検証用データを投入しました:", {
    users: await prisma.user.count(),
    equipment: await prisma.equipment.count(),
    loans: await prisma.loan.count(),
    auditLogs: await prisma.auditLog.count(),
    活性な申請: created ? activeCount : 0,
  });
}

async function main() {
  if (process.argv.includes("--clean")) {
    await clean();
    return;
  }
  await generate();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
