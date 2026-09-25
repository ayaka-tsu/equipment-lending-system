/**
 * サービス層（auth-service）と HTTP 層（session-cookie）をつなぐ薄い層。
 * Route Handler と画面からは、ここの関数を呼ぶ。
 */
import { findUserBySessionToken, issueSession, revokeSession } from "./auth-service";
import type { SessionUser } from "./auth-service";
import { clearSessionCookie, readSessionToken, setSessionCookie } from "./session-cookie";

export type { SessionUser };

/** ログインしたときに呼ぶ。セッションを発行し、Cookie に入れる。 */
export async function startSession(userId: number): Promise<void> {
  const { token, expiresAt } = await issueSession(userId);
  await setSessionCookie(token, expiresAt);
}

/** ログイン中の社員を返す。未ログイン・期限切れなら null。 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await readSessionToken();
  if (!token) return null;
  return findUserBySessionToken(token);
}

/** ログアウトしたときに呼ぶ。DB のセッションを消し、Cookie も消す。 */
export async function endSession(): Promise<void> {
  const token = await readSessionToken();
  if (token) await revokeSession(token);
  await clearSessionCookie();
}
