/**
 * API のアクセス制御（docs/06_api_design.md 2.2、NFR-S-06）
 *
 * 画面でメニューを隠すことは権限のチェックとみなさない。
 * 管理者向けの API は必ずこの関数を通し、一般社員には 403 を返す。
 */
import type { SessionUser } from "@/server/auth/session";
import { getCurrentUser } from "@/server/auth/session";

import { errorResponse } from "./response";

export type GuardResult = { ok: true; user: SessionUser } | { ok: false; response: Response };

/** ログインしていることを求める。していなければ 401。 */
export async function requireUser(): Promise<GuardResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: errorResponse("UNAUTHENTICATED") };
  return { ok: true, user };
}

/** 管理者であることを求める。未ログインは 401、一般社員は 403。 */
export async function requireAdmin(): Promise<GuardResult> {
  const result = await requireUser();
  if (!result.ok) return result;
  if (result.user.role !== "admin") {
    return { ok: false, response: errorResponse("FORBIDDEN") };
  }
  return result;
}
