import { describe, expect, it } from "vitest";

import { sessionCookieOptions } from "@/server/auth/session-cookie";
import {
  SESSION_TTL_MS,
  generateSessionToken,
  hashSessionToken,
  isSessionValid,
} from "@/server/auth/token";

describe("セッショントークン（NFR-S-03）", () => {
  it("32バイト以上の乱数から作られ、毎回異なる", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toBe(b);
    // base64url の 32 バイトは 43 文字
    expect(a.length).toBeGreaterThanOrEqual(43);
  });

  it("DB に保存するのは SHA-256 のハッシュ（16進64文字）で、トークンそのものを含まない", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
  });

  it("同じトークンからは同じハッシュになる", () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });
});

describe("有効期限（NFR-S-04）", () => {
  const now = new Date("2026-09-25T10:00:00Z");

  it("有効期限は8時間", () => {
    expect(SESSION_TTL_MS).toBe(8 * 60 * 60 * 1000);
  });

  it("期限内なら有効", () => {
    expect(isSessionValid(new Date(now.getTime() + 1000), now)).toBe(true);
  });

  it("期限を過ぎていたら無効", () => {
    expect(isSessionValid(new Date(now.getTime() - 1000), now)).toBe(false);
  });

  it("ちょうど期限の時刻は無効として扱う", () => {
    expect(isSessionValid(new Date(now.getTime()), now)).toBe(false);
  });
});

describe("Cookie の属性（NFR-S-03）", () => {
  const options = sessionCookieOptions(new Date("2026-09-25T18:00:00Z"));

  it("HttpOnly・SameSite=Lax・Path=/ が付く", () => {
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  it("開発環境では Secure を付けない（本番のみ）", () => {
    expect(options.secure).toBe(process.env.NODE_ENV === "production");
  });
});
