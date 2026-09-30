/**
 * SCR-01 ログインの操作をまとめたもの。
 * 各テストが同じ手順を書かないように、ここを呼ぶ。
 */
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export function loginForm(page: Page) {
  return {
    email: page.getByLabel("メールアドレス"),
    password: page.getByLabel("パスワード"),
    submit: page.getByRole("button", { name: "ログイン" }),
    // Next.js の画面遷移アナウンサーも role="alert" を持つため、フォームの中に限定する
    error: page.locator("form").getByRole("alert"),
  };
}

/** ログイン画面を開いて入力し、送信する。遷移の確認は呼び出し側で行う。 */
export async function submitLogin(
  page: Page,
  credentials: { email: string; password: string },
): Promise<void> {
  await page.goto("/login");
  const form = loginForm(page);
  await form.email.fill(credentials.email);
  await form.password.fill(credentials.password);
  await form.submit.click();
}

/** ログインしてホームに着くまで待つ。 */
export async function login(
  page: Page,
  credentials: { email: string; password: string },
): Promise<void> {
  await submitLogin(page, credentials);
  await expect(page).toHaveURL("/");
}
