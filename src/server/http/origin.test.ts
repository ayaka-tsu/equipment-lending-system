import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { checkOrigin } from "@/server/http/origin";

const APP_ORIGIN = "http://localhost:3000";

function request(method: string, origin?: string) {
  return new Request("http://localhost:3000/api/loans", {
    method,
    headers: origin ? { origin } : {},
  });
}

describe("Origin の検証（NFR-S-11）", () => {
  const original = process.env.APP_ORIGIN;

  beforeEach(() => {
    process.env.APP_ORIGIN = APP_ORIGIN;
  });

  afterEach(() => {
    process.env.APP_ORIGIN = original;
  });

  it("参照系（GET）は検証しない", () => {
    expect(checkOrigin(request("GET"))).toBeNull();
  });

  it("更新系で Origin が一致すれば通す", () => {
    expect(checkOrigin(request("POST", APP_ORIGIN))).toBeNull();
  });

  it("更新系で Origin が異なれば 403", async () => {
    const response = checkOrigin(request("POST", "https://evil.example.com"));
    expect(response?.status).toBe(403);
    const body = await response!.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("更新系で Origin が無ければ 403", () => {
    expect(checkOrigin(request("DELETE"))?.status).toBe(403);
  });

  it("APP_ORIGIN が未設定なら起動時に気付けるよう例外にする", () => {
    delete process.env.APP_ORIGIN;
    expect(() => checkOrigin(request("POST", APP_ORIGIN))).toThrow();
  });
});
