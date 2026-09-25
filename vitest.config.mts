import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // tsconfig.json の paths（@/*）をテストでも解決する
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    // .env を読み込む（セッション周りのモジュールが DATABASE_URL を参照するため）
    setupFiles: ["dotenv/config"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // 日付の判定がサーバーのタイムゾーンに依存していないことを確かめるため、
    // テストは UTC で実行する（NFR-E-04）。
    env: { TZ: "UTC" },
  },
});
