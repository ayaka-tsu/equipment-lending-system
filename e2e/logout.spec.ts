/**
 * ログアウト（FR-02 / NFR-S-04）の E2E。
 * ISSUE-02 の受入条件「Cookie が消え、sessions の行も削除される」に対応する。
 */
import { expect, test } from "@playwright/test";

import { findSessionByToken } from "./helpers/db";
import { login } from "./helpers/login";
import { MEMBER } from "./helpers/seed-users";
import { getSessionCookie, getSessionToken } from "./helpers/session-cookie";

test("ログアウトすると Cookie が消え、sessions の行も消える", async ({ page, context }) => {
  await login(page, MEMBER);
  const token = await getSessionToken(context);
  expect(await findSessionByToken(token)).not.toBeNull();

  await page.getByRole("button", { name: "ログアウト" }).click();

  await expect(page).toHaveURL("/login");
  expect(await getSessionCookie(context)).toBeUndefined();
  expect(await findSessionByToken(token)).toBeNull();
});

test("ログアウトしたあとにホームを開いても、ログイン状態に戻らない", async ({ page }) => {
  await login(page, MEMBER);
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL("/login");

  await page.goto("/");

  await expect(page.getByText("ログインしていません。")).toBeVisible();
  await expect(page.getByRole("button", { name: "ログアウト" })).toBeHidden();
});
