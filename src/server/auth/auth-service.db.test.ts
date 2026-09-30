/**
 * サービス層を実際の DB につないで検証する（NFR-S-02・S-03・S-04、BR-17）。
 *
 * コメントで「DB にはハッシュだけを保存する」と書いても、それが本当かはコメントでは保証できない。
 * ここで、実際に保存された行を読んで確かめる。
 *
 * 実行には DB が必要（`docker compose up -d`。CI では services の postgres を使う）。
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  authenticate,
  findUserBySessionToken,
  issueSession,
  revokeSession,
} from "@/server/auth/auth-service";
import { hashPassword } from "@/server/auth/password";
import { SESSION_TTL_MS } from "@/server/auth/token";

const EMPLOYEE_CODE = "TEST0001";
const EMAIL = "auth-service-test@example.com";
const PASSWORD = "test-password-123";

let userId: number;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { employeeCode: EMPLOYEE_CODE } });
  const user = await prisma.user.create({
    data: {
      employeeCode: EMPLOYEE_CODE,
      name: "テスト 太郎",
      email: EMAIL,
      passwordHash: await hashPassword(PASSWORD),
      department: "開発部",
      role: "member",
    },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { employeeCode: EMPLOYEE_CODE } });
  await prisma.$disconnect();
});

describe("authenticate（FR-01 / BR-17）", () => {
  it("正しいメールアドレスとパスワードで社員を返す", async () => {
    const user = await authenticate(EMAIL, PASSWORD);
    expect(user?.employeeCode).toBe(EMPLOYEE_CODE);
  });

  it("パスワードが違えば null", async () => {
    expect(await authenticate(EMAIL, "wrong-password")).toBeNull();
  });

  it("存在しないメールアドレスでも、パスワード誤りと同じく null（区別しない）", async () => {
    expect(await authenticate("nobody@example.com", PASSWORD)).toBeNull();
  });

  it("メールアドレスの大文字小文字は区別しない", async () => {
    expect(await authenticate(EMAIL.toUpperCase(), PASSWORD)).not.toBeNull();
  });

  it("返す社員の情報にパスワードハッシュを含めない", async () => {
    const user = await authenticate(EMAIL, PASSWORD);
    expect(user).not.toBeNull();
    expect(Object.keys(user!)).toEqual(
      expect.arrayContaining(["id", "employeeCode", "name", "email", "department", "role"]),
    );
    expect(JSON.stringify(user)).not.toContain("$2");
  });
});

describe("issueSession（NFR-S-03 / S-04）", () => {
  it("DB に保存されるのはトークンのハッシュだけで、トークンそのものは保存されない", async () => {
    const { token } = await issueSession(userId);

    const rows = await prisma.$queryRaw<{ token_hash: string }[]>`
      SELECT token_hash FROM sessions WHERE user_id = ${userId}`;
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(row.token_hash).not.toBe(token);
    }

    // テーブル全体を対象に、平文トークンを含む行が無いことを確かめる
    const [{ count }] = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM sessions WHERE token_hash LIKE ${"%" + token + "%"}`;
    expect(Number(count)).toBe(0);

    await revokeSession(token);
  });

  it("有効期限は発行から8時間後", async () => {
    const now = new Date("2026-09-25T00:00:00Z");
    const { token, expiresAt } = await issueSession(userId, now);
    expect(expiresAt.getTime() - now.getTime()).toBe(SESSION_TTL_MS);
    await revokeSession(token);
  });

  it("発行したトークンから社員を引ける", async () => {
    const { token } = await issueSession(userId);
    const user = await findUserBySessionToken(token);
    expect(user?.id).toBe(userId);
    await revokeSession(token);
  });

  it("期限を過ぎたトークンでは社員を引けない", async () => {
    const issuedAt = new Date(Date.now() - SESSION_TTL_MS - 1000);
    const { token } = await issueSession(userId, issuedAt);
    expect(await findUserBySessionToken(token)).toBeNull();
    await revokeSession(token);
  });

  it("revokeSession のあとは引けない（ログアウト）", async () => {
    const { token } = await issueSession(userId);
    await revokeSession(token);
    expect(await findUserBySessionToken(token)).toBeNull();
  });
});
