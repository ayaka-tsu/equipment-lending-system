/**
 * SCR-01 ログイン（FR-01 / BR-17）の E2E。
 * ISSUE-02 の受入条件「ログインできる」「どちらが誤りかは区別されない」に対応する。
 */
import { expect, test } from "@playwright/test";

import { loginForm, login, submitLogin } from "./helpers/login";
import { MEMBER } from "./helpers/seed-users";

const INVALID_CREDENTIALS_MESSAGE = "メールアドレスまたはパスワードが正しくありません";

test("正しいメールアドレスとパスワードでログインでき、ホームへ移動する", async ({ page }) => {
  await submitLogin(page, MEMBER);

  await expect(page).toHaveURL("/");
  await expect(page.getByText(`${MEMBER.name}（${MEMBER.department}）`)).toBeVisible();
});

test("パスワードが誤っているとログインできず、パスワード欄だけが空になる", async ({ page }) => {
  await submitLogin(page, { email: MEMBER.email, password: "wrong-password" });

  const form = loginForm(page);
  await expect(form.error).toContainText(INVALID_CREDENTIALS_MESSAGE);
  await expect(page).toHaveURL("/login");
  // 入れ直す手間を減らすため、メールアドレスは残してパスワードだけ空にする（SCR-01）
  await expect(form.password).toHaveValue("");
  await expect(form.email).toHaveValue(MEMBER.email);
});

test("存在しないメールアドレスでも、パスワード誤りと同じ文言になる（BR-17）", async ({ page }) => {
  await submitLogin(page, { email: "nobody@example.com", password: MEMBER.password });

  const form = loginForm(page);
  await expect(form.error).toContainText(INVALID_CREDENTIALS_MESSAGE);
  // 「そのメールアドレスは登録されていない」と読み取れる言葉が出ていないこと
  await expect(form.error).not.toContainText("登録");
  await expect(form.error).not.toContainText("見つかりません");
});

test("未入力のまま送信すると、両方にメッセージが出てAPIを呼ばない", async ({ page }) => {
  const loginRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/auth/login") loginRequests.push(request.url());
  });

  await page.goto("/login");
  await loginForm(page).submit.click();

  await expect(page.getByText("メールアドレスを入力してください")).toBeVisible();
  await expect(page.getByText("パスワードを入力してください")).toBeVisible();
  expect(loginRequests).toHaveLength(0);
});

test("メールアドレスの形式が正しくないとメッセージが出る", async ({ page }) => {
  await submitLogin(page, { email: "not-an-email", password: MEMBER.password });

  await expect(page.getByText("メールアドレスの形式が正しくありません")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("?reason=expired のときはセッション切れの案内が出る", async ({ page }) => {
  await page.goto("/login?reason=expired");

  await expect(
    page.getByText("セッションの有効期限が切れました。再度ログインしてください。"),
  ).toBeVisible();
});

test("ログイン済みの利用者がログイン画面を開くとホームへ移動する", async ({ page }) => {
  await login(page, MEMBER);

  await page.goto("/login");

  await expect(page).toHaveURL("/");
});
