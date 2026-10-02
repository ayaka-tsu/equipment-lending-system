/**
 * API のアクセス制御（NFR-S-06）。
 * 画面を隠すだけでなく、API 側でも権限を見ていることを確かめる。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAdmin, requireUser } from "@/server/http/auth-guard";

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/server/auth/session", () => ({ getCurrentUser }));

const MEMBER = {
  id: 3,
  employeeCode: "E0012",
  name: "山田 太郎",
  email: "member1@example.com",
  department: "開発部",
  role: "member",
};
const ADMIN = { ...MEMBER, id: 1, employeeCode: "E0001", role: "admin" };

beforeEach(() => {
  getCurrentUser.mockReset();
});

async function body(response: Response) {
  return (await response.json()) as { error: { code: string } };
}

describe("requireUser", () => {
  it("未ログインなら 401 UNAUTHENTICATED", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await requireUser();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    expect((await body(result.response)).error.code).toBe("UNAUTHENTICATED");
  });

  it("ログイン済みなら社員を返す", async () => {
    getCurrentUser.mockResolvedValue(MEMBER);
    const result = await requireUser();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.email).toBe("member1@example.com");
  });
});

describe("requireAdmin", () => {
  it("未ログインなら 401 UNAUTHENTICATED", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await requireAdmin();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
  });

  it("一般社員なら 403 FORBIDDEN（画面を隠すだけにしない）", async () => {
    getCurrentUser.mockResolvedValue(MEMBER);
    const result = await requireAdmin();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(403);
    expect((await body(result.response)).error.code).toBe("FORBIDDEN");
  });

  it("管理者なら通す", async () => {
    getCurrentUser.mockResolvedValue(ADMIN);
    const result = await requireAdmin();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.role).toBe("admin");
  });
});
