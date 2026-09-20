/**
 * 初期データ投入（NFR-T-02）。
 * 何度実行しても同じ結果になる（社員・カテゴリ・備品は upsert、申請と操作履歴は入れ直す）。
 *
 *   npm run db:seed
 *
 * パスワードは全員共通。環境変数 SEED_PASSWORD で変えられる。
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "@/generated/prisma/client";
import { addDaysToDateString, todayInJst } from "@/lib/date";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "password123";

/** 今日（日本時間）から n 日後の日付 */
const day = (offset: number) => new Date(`${addDaysToDateString(todayInJst(), offset)}T00:00:00Z`);
/** 今日から n 日前の 10:00（日本時間） */
const at = (offset: number, hour = 10) =>
  new Date(
    `${addDaysToDateString(todayInJst(), offset)}T${String(hour - 9).padStart(2, "0")}:00:00Z`,
  );

const categories = [
  { name: "PC", sortOrder: 10 },
  { name: "モニター", sortOrder: 20 },
  { name: "周辺機器", sortOrder: 30 },
  { name: "書籍", sortOrder: 40 },
  { name: "通信機器", sortOrder: 50 },
  { name: "その他", sortOrder: 60 },
];

const users = [
  {
    employeeCode: "E0001",
    name: "佐藤 花子",
    email: "admin1@example.com",
    department: "総務部",
    role: "admin",
  },
  {
    employeeCode: "E0002",
    name: "小林 誠",
    email: "admin2@example.com",
    department: "総務部",
    role: "admin",
  },
  {
    employeeCode: "E0012",
    name: "山田 太郎",
    email: "member1@example.com",
    department: "開発部",
    role: "member",
  },
  {
    employeeCode: "E0018",
    name: "田中 美咲",
    email: "member2@example.com",
    department: "開発部",
    role: "member",
  },
  {
    employeeCode: "E0023",
    name: "高橋 健",
    email: "member3@example.com",
    department: "営業部",
    role: "member",
  },
  {
    employeeCode: "E0031",
    name: "鈴木 一郎",
    email: "member4@example.com",
    department: "営業部",
    role: "member",
  },
  {
    employeeCode: "E0040",
    name: "伊藤 さくら",
    email: "member5@example.com",
    department: "管理部",
    role: "member",
  },
  {
    employeeCode: "E0044",
    name: "渡辺 直樹",
    email: "member6@example.com",
    department: "開発部",
    role: "member",
  },
  {
    employeeCode: "E0051",
    name: "中村 彩",
    email: "member7@example.com",
    department: "管理部",
    role: "member",
  },
  {
    employeeCode: "E0059",
    name: "加藤 大輔",
    email: "member8@example.com",
    department: "営業部",
    role: "member",
  },
];

const CABINET = "本社3F 総務キャビネット";
const SHELF = "本社3F 書棚A";

type EquipmentSeed = {
  assetCode: string;
  name: string;
  category: string;
  quantity: number;
  storageLocation: string;
  description?: string;
  status?: string;
};

const equipment: EquipmentSeed[] = [
  ...Array.from({ length: 12 }, (_, i) => ({
    assetCode: `PC-${String(i + 1).padStart(4, "0")}`,
    name: i < 8 ? "ノートPC（14インチ）" : "ノートPC（16インチ）",
    category: "PC",
    quantity: 1,
    storageLocation: CABINET,
    description: "Windows 11 / メモリ16GB\n充電器・マウス付き",
    // PC-0003 は修理予定のため貸出停止中
    status: i === 2 ? "suspended" : "active",
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    assetCode: `MN-${String(i + 1).padStart(4, "0")}`,
    name: i < 4 ? "27インチモニター" : "24インチモニター",
    category: "モニター",
    quantity: 1,
    storageLocation: CABINET,
  })),
  {
    assetCode: "AC-0018",
    name: "ワイヤレスマウス",
    category: "周辺機器",
    quantity: 8,
    storageLocation: CABINET,
  },
  {
    assetCode: "AC-0019",
    name: "USBキーボード",
    category: "周辺機器",
    quantity: 6,
    storageLocation: CABINET,
  },
  {
    assetCode: "AC-0020",
    name: "ウェブカメラ",
    category: "周辺機器",
    quantity: 4,
    storageLocation: CABINET,
  },
  {
    assetCode: "AC-0021",
    name: "USB-Cハブ",
    category: "周辺機器",
    quantity: 6,
    storageLocation: CABINET,
  },
  {
    assetCode: "AC-0022",
    name: "ノートPCスタンド",
    category: "周辺機器",
    quantity: 5,
    storageLocation: CABINET,
  },
  {
    assetCode: "BK-0012",
    name: "リーダブルコード",
    category: "書籍",
    quantity: 3,
    storageLocation: SHELF,
    description: "より良いコードを書くためのシンプルで実践的なテクニック",
  },
  {
    assetCode: "BK-0015",
    name: "達人プログラマー",
    category: "書籍",
    quantity: 2,
    storageLocation: SHELF,
  },
  {
    assetCode: "BK-0021",
    name: "SQLアンチパターン",
    category: "書籍",
    quantity: 2,
    storageLocation: SHELF,
  },
  {
    assetCode: "NW-0001",
    name: "モバイルWi-Fiルーター",
    category: "通信機器",
    quantity: 5,
    storageLocation: CABINET,
  },
  {
    assetCode: "NW-0002",
    name: "モバイルWi-Fiルーター",
    category: "通信機器",
    quantity: 5,
    storageLocation: CABINET,
  },
  {
    assetCode: "NW-0003",
    name: "有線LANアダプター",
    category: "通信機器",
    quantity: 4,
    storageLocation: CABINET,
  },
  {
    assetCode: "OT-0001",
    name: "プロジェクター",
    category: "その他",
    quantity: 2,
    storageLocation: CABINET,
  },
];

type LoanSeed = {
  assetCode: string;
  borrower: string; // employeeCode
  status: string;
  purpose: string;
  dueDays: number;
  createdDays: number;
  reviewer?: string;
  reviewedDays?: number;
  rejectReason?: string;
  lentDays?: number;
  returnedDays?: number;
  cancelledDays?: number;
};

const loans: LoanSeed[] = [
  {
    assetCode: "MN-0004",
    borrower: "E0012",
    status: "pending",
    purpose: "客先常駐先での作業で2画面環境が必要なため",
    dueDays: 13,
    createdDays: -2,
  },
  {
    assetCode: "BK-0015",
    borrower: "E0018",
    status: "pending",
    purpose: "設計レビューの参考にするため",
    dueDays: 12,
    createdDays: -2,
  },
  {
    assetCode: "NW-0002",
    borrower: "E0023",
    status: "pending",
    purpose: "出張先でのオンライン商談に使用するため",
    dueDays: 5,
    createdDays: -3,
  },
  {
    assetCode: "AC-0021",
    borrower: "E0012",
    status: "approved",
    purpose: "客先でのプレゼン用に外部出力が必要なため",
    dueDays: 11,
    createdDays: -3,
    reviewer: "E0001",
    reviewedDays: -3,
  },
  {
    assetCode: "AC-0018",
    borrower: "E0040",
    status: "lent",
    purpose: "社内研修の準備で使用するため",
    dueDays: 7,
    createdDays: -8,
    reviewer: "E0002",
    reviewedDays: -8,
    lentDays: -7,
  },
  {
    assetCode: "BK-0012",
    borrower: "E0012",
    status: "lent",
    purpose: "新人研修の課題図書として読むため",
    dueDays: 2,
    createdDays: -12,
    reviewer: "E0001",
    reviewedDays: -12,
    lentDays: -11,
  },
  {
    assetCode: "PC-0003",
    borrower: "E0012",
    status: "lent",
    purpose: "客先常駐で使用するため",
    dueDays: -1,
    createdDays: -15,
    reviewer: "E0001",
    reviewedDays: -14,
    lentDays: -14,
  },
  {
    assetCode: "PC-0010",
    borrower: "E0031",
    status: "lent",
    purpose: "展示会での説明用に使用するため",
    dueDays: -18,
    createdDays: -30,
    reviewer: "E0002",
    reviewedDays: -30,
    lentDays: -29,
  },
  {
    assetCode: "BK-0021",
    borrower: "E0044",
    status: "returned",
    purpose: "DB設計の参考にするため",
    dueDays: -20,
    createdDays: -40,
    reviewer: "E0001",
    reviewedDays: -40,
    lentDays: -39,
    returnedDays: -21,
  },
  {
    assetCode: "AC-0020",
    borrower: "E0051",
    status: "returned",
    purpose: "オンライン面接の対応で使用するため",
    dueDays: -10,
    createdDays: -25,
    reviewer: "E0002",
    reviewedDays: -25,
    lentDays: -24,
    returnedDays: -11,
  },
  {
    assetCode: "MN-0006",
    borrower: "E0012",
    status: "rejected",
    purpose: "自宅での作業に使用するため",
    dueDays: -8,
    createdDays: -30,
    reviewer: "E0001",
    reviewedDays: -30,
    rejectReason: "社外への持ち出しは対象外のため",
  },
  {
    assetCode: "NW-0003",
    borrower: "E0018",
    status: "cancelled",
    purpose: "出張で使用する予定だったため",
    dueDays: -40,
    createdDays: -60,
    cancelledDays: -58,
  },
];

const ACTION_BY_STATUS: Record<string, string> = {
  approved: "loan.approve",
  lent: "loan.lend",
  returned: "loan.return",
  rejected: "loan.reject",
  cancelled: "loan.cancel",
};

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { sortOrder: category.sortOrder },
      create: category,
    });
  }

  for (const user of users) {
    await prisma.user.upsert({
      where: { employeeCode: user.employeeCode },
      update: {
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        passwordHash,
      },
      create: { ...user, passwordHash },
    });
  }

  const categoryByName = new Map((await prisma.category.findMany()).map((c) => [c.name, c.id]));
  for (const item of equipment) {
    const data = {
      name: item.name,
      categoryId: categoryByName.get(item.category)!,
      quantity: item.quantity,
      storageLocation: item.storageLocation,
      description: item.description ?? null,
      status: item.status ?? "active",
      deletedAt: null,
    };
    await prisma.equipment.upsert({
      where: { assetCode: item.assetCode },
      update: data,
      create: { assetCode: item.assetCode, ...data },
    });
  }

  // 申請と操作履歴は毎回入れ直す（日付を今日基準で作り直すため）
  await prisma.auditLog.deleteMany();
  await prisma.loan.deleteMany();

  const userByCode = new Map((await prisma.user.findMany()).map((u) => [u.employeeCode, u]));
  const equipmentByCode = new Map((await prisma.equipment.findMany()).map((e) => [e.assetCode, e]));

  for (const seed of loans) {
    const item = equipmentByCode.get(seed.assetCode)!;
    const borrower = userByCode.get(seed.borrower)!;
    const reviewer = seed.reviewer ? userByCode.get(seed.reviewer)! : null;

    const loan = await prisma.loan.create({
      data: {
        equipmentId: item.id,
        borrowerId: borrower.id,
        status: seed.status,
        purpose: seed.purpose,
        dueDate: day(seed.dueDays),
        reviewedBy: reviewer?.id ?? null,
        reviewedAt: seed.reviewedDays === undefined ? null : at(seed.reviewedDays, 13),
        rejectReason: seed.rejectReason ?? null,
        lentAt: seed.lentDays === undefined ? null : at(seed.lentDays, 9),
        returnedAt: seed.returnedDays === undefined ? null : at(seed.returnedDays, 17),
        cancelledBy: seed.cancelledDays === undefined ? null : borrower.id,
        cancelledAt: seed.cancelledDays === undefined ? null : at(seed.cancelledDays, 15),
        createdAt: at(seed.createdDays),
        updatedAt: at(seed.createdDays),
      },
    });

    const detail = {
      equipmentAssetCode: item.assetCode,
      equipmentName: item.name,
      borrowerName: borrower.name,
    };

    await prisma.auditLog.create({
      data: {
        actorId: borrower.id,
        action: "loan.request",
        targetType: "loan",
        targetId: loan.id,
        detail,
        createdAt: at(seed.createdDays),
      },
    });

    const action = ACTION_BY_STATUS[seed.status];
    if (action) {
      const actor = seed.status === "cancelled" ? borrower : (reviewer ?? userByCode.get("E0001")!);
      await prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action,
          targetType: "loan",
          targetId: loan.id,
          detail: seed.rejectReason ? { ...detail, reason: seed.rejectReason } : detail,
          createdAt: at(seed.reviewedDays ?? seed.cancelledDays ?? seed.createdDays, 13),
        },
      });
    }
  }

  // 備品に対する操作履歴のサンプル
  const suspended = equipmentByCode.get("PC-0003")!;
  const admin = userByCode.get("E0001")!;
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "equipment.update",
      targetType: "equipment",
      targetId: suspended.id,
      detail: {
        assetCode: suspended.assetCode,
        name: suspended.name,
        changes: { status: { before: "active", after: "suspended" } },
      },
      createdAt: at(-1, 10),
    },
  });

  const counts = {
    categories: await prisma.category.count(),
    users: await prisma.user.count(),
    equipment: await prisma.equipment.count(),
    loans: await prisma.loan.count(),
    auditLogs: await prisma.auditLog.count(),
  };
  console.log("シードを投入しました:", counts);
  console.log(`ログイン用パスワード: ${SEED_PASSWORD}（環境変数 SEED_PASSWORD で変更できます）`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
