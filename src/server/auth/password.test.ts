import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("パスワードのハッシュ化（NFR-S-02）", () => {
  it("bcrypt のコスト10以上で保存される", async () => {
    const hash = await hashPassword("password123");
    // $2b$10$... の形式。コストが10未満でないことを確かめる
    const cost = Number(hash.split("$")[2]);
    expect(hash.startsWith("$2")).toBe(true);
    expect(cost).toBeGreaterThanOrEqual(10);
  });

  it("同じパスワードでもハッシュは毎回変わる（ソルトが付く）", async () => {
    const a = await hashPassword("password123");
    const b = await hashPassword("password123");
    expect(a).not.toBe(b);
  });

  it("平文がハッシュに含まれない", async () => {
    const hash = await hashPassword("password123");
    expect(hash).not.toContain("password123");
  });

  it("正しいパスワードだけ照合に通る", async () => {
    const hash = await hashPassword("password123");
    expect(await verifyPassword("password123", hash)).toBe(true);
    expect(await verifyPassword("password124", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });
});
