/**
 * セッション Cookie を E2E から見るための補助。
 *
 * 名前と属性は仕様（docs/06_api_design.md 2.4、NFR-S-03）で決まっているので、
 * ここではアプリの実装を import せず、外から見た仕様の値をそのまま書いている。
 */
import type { BrowserContext, Cookie } from "@playwright/test";

export const SESSION_COOKIE_NAME = "session_token";

export async function getSessionCookie(context: BrowserContext): Promise<Cookie | undefined> {
  const cookies = await context.cookies();
  return cookies.find((cookie) => cookie.name === SESSION_COOKIE_NAME);
}

/** セッション Cookie があることを前提に、その値（トークン）を返す。 */
export async function getSessionToken(context: BrowserContext): Promise<string> {
  const cookie = await getSessionCookie(context);
  if (!cookie) throw new Error(`Cookie ${SESSION_COOKIE_NAME} が見つかりません`);
  return cookie.value;
}
