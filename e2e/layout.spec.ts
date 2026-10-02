/**
 * 共通レイアウトとアクセス制御（FR-03 / NFR-S-06 / NFR-E-02）の E2E。
 * ISSUE-03 の受入条件に対応する。
 */
import { expect, test } from "@playwright/test";

import { expireSession } from "./helpers/db";
import { login } from "./helpers/login";
import { ADMIN, MEMBER } from "./helpers/seed-users";
import { getSessionToken } from "./helpers/session-cookie";

const ADMIN_MENUS = ["管理ダッシュボード", "申請・貸出管理", "操作履歴"];

test("一般社員のヘッダーには、管理者向けのメニューが出ない（NFR-S-06）", async ({ page }) => {
  await login(page, MEMBER);

  const nav = page.getByRole("navigation", { name: "メインメニュー" });
  await expect(nav.getByRole("link", { name: "ホーム" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "備品一覧" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "申請履歴" })).toBeVisible();
  for (const label of ADMIN_MENUS) {
    await expect(nav.getByRole("link", { name: label })).toHaveCount(0);
  }
  await expect(
    page.getByRole("banner").getByText(`${MEMBER.name}（${MEMBER.department}）`),
  ).toBeVisible();
});

test("管理者のヘッダーには、管理者向けのメニューが出る", async ({ page }) => {
  await login(page, ADMIN);

  const nav = page.getByRole("navigation", { name: "メインメニュー" });
  for (const label of ADMIN_MENUS) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }
  await expect(
    page.getByRole("banner").getByText(`${ADMIN.name}（${ADMIN.department}）`),
  ).toBeVisible();
});

test("表示中の画面のメニューだけが強調される", async ({ page }) => {
  await login(page, ADMIN);

  const nav = page.getByRole("navigation", { name: "メインメニュー" });
  await expect(nav.getByRole("link", { name: "ホーム" })).toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "管理ダッシュボード" }).click();
  await expect(page).toHaveURL("/admin");
  await expect(nav.getByRole("link", { name: "管理ダッシュボード" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: "ホーム" })).not.toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("ヘッダーのシステム名からホームへ戻れる", async ({ page }) => {
  await login(page, ADMIN);
  await page.goto("/admin");

  await page.getByRole("banner").getByRole("link").first().click();

  await expect(page).toHaveURL("/");
});

test("未ログインでホームを開くとログイン画面へ移動する（FR-03）", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL("/login");
  await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
});

test("未ログインでは、存在しない URL でもログイン画面へ移動する", async ({ page }) => {
  await page.goto("/equipment/999999");

  await expect(page).toHaveURL("/login");
});

test("一般社員が /admin を開くと 403 の画面が出る（NFR-S-06）", async ({ page }) => {
  await login(page, MEMBER);

  const response = await page.goto("/admin");

  expect(response?.status()).toBe(403);
  await expect(page.getByText("403")).toBeVisible();
  await expect(page.getByText("このページを表示する権限がありません")).toBeVisible();
  // ログインはしているので共通ヘッダーは出る
  await expect(page.getByRole("banner")).toBeVisible();
});

test("管理者が /admin を開くと管理ダッシュボードが出る", async ({ page }) => {
  await login(page, ADMIN);

  const response = await page.goto("/admin");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "管理ダッシュボード" })).toBeVisible();
});

test("存在しない URL では 404 の画面が出る", async ({ page }) => {
  await login(page, MEMBER);

  const response = await page.goto("/equipment/999999");

  expect(response?.status()).toBe(404);
  await expect(page.getByText("ページが見つかりません")).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
});

test("ログアウトしたあと戻るボタンで戻っても、ログイン画面へ移動する", async ({ page }) => {
  await login(page, MEMBER);
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL("/login");

  await page.goBack();

  await expect(page).toHaveURL("/login");
  await expect(page.getByRole("banner")).toHaveCount(0);
});

test("セッションが切れた状態で画面を開くと、期限切れの案内つきでログイン画面へ移動する", async ({
  page,
  context,
}) => {
  await login(page, MEMBER);
  const token = await getSessionToken(context);
  await expireSession(token);

  await page.goto("/");

  await expect(page).toHaveURL("/login?reason=expired");
  await expect(
    page.getByText("セッションの有効期限が切れました。再度ログインしてください。"),
  ).toBeVisible();
});

test("幅375pxでも横スクロールが出ない（NFR-E-02）", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page, ADMIN);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
