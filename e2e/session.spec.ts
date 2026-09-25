/**
 * セッションの扱い（NFR-S-03 / NFR-S-04）の E2E。
 * ISSUE-02 の受入条件のうち、開発者ツールや psql で目視していた項目を自動で確かめる。
 */
import { expect, test } from "@playwright/test";

import { countSessionsWithRawToken, expireSession, findSessionByToken } from "./helpers/db";
import { login } from "./helpers/login";
import { MEMBER } from "./helpers/seed-users";
import { getSessionCookie, getSessionToken } from "./helpers/session-cookie";

test("セッション Cookie に HttpOnly と SameSite=Lax が付いている（NFR-S-03）", async ({
  page,
  context,
}) => {
  await login(page, MEMBER);

  const cookie = await getSessionCookie(context);
  expect(cookie).toBeDefined();
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(cookie?.path).toBe("/");
  // Secure は本番だけ付く（http://localhost では付かない）ので、ここでは確かめない
});

test("sessions にトークンそのものが保存されていない（NFR-S-03）", async ({ page, context }) => {
  await login(page, MEMBER);
  const token = await getSessionToken(context);

  // Cookie の値そのままでは引けず、ハッシュでだけ引ける
  expect(await countSessionsWithRawToken(token)).toBe(0);
  expect(await findSessionByToken(token)).not.toBeNull();
});

test("有効期限が切れたセッションでは、ログイン状態として扱われない（NFR-S-04）", async ({
  page,
  context,
}) => {
  await login(page, MEMBER);
  const token = await getSessionToken(context);

  // 8時間待てないので、DB の有効期限を過去に書き換えて同じ状態を作る
  await expireSession(token);

  const response = await page.request.get("/api/auth/me");
  expect(response.status()).toBe(401);

  await page.goto("/");
  await expect(page.getByText("ログインしていません。")).toBeVisible();
});
