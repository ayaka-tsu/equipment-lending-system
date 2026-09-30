/**
 * E2E で使うログイン情報。`npm run db:seed` が入れた社員をそのまま使う。
 * シードを変えたときは、ここも合わせて直す（`prisma/seed.ts`）。
 */
export const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "password123";

/** 一般社員（role: member）。 */
export const MEMBER = {
  email: "member1@example.com",
  password: SEED_PASSWORD,
  name: "山田 太郎",
  department: "開発部",
};

/** 管理者（role: admin）。承認・却下や備品管理の E2E で使う。 */
export const ADMIN = {
  email: "admin1@example.com",
  password: SEED_PASSWORD,
  name: "佐藤 花子",
  department: "総務部",
};
