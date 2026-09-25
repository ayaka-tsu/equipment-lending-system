/**
 * E2E テスト（Playwright）の設定。
 *
 * 単体テスト（Vitest）が関数の中身を確かめるのに対して、E2E は
 * ブラウザを実際に操作して、Issue の受入条件どおりに動くかを確かめる。
 * 本番と同じ形で確かめるため、`next build` + `next start` に対して実行する。
 */
import "dotenv/config";

import { defineConfig, devices } from "@playwright/test";

/** APP_ORIGIN（Origin 検証。NFR-S-11）と同じオリジンで動かす必要がある。 */
const BASE_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  // `test.only` が残ったまま push されたら CI で落とす
  forbidOnly: Boolean(process.env.CI),
  // CI だけ 1 回やり直す。やり直して通ったテストはレポートに flaky として残る
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "ja-JP",
    // 日付の判定は日本時間で行う（BR-18）
    timezoneId: "Asia/Tokyo",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start",
    url: BASE_URL,
    // すでに `npm run dev` を動かしているときは、それをそのまま使う
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
