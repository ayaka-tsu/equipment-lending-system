import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // 日付の判定がサーバーのタイムゾーンに依存していないことを確かめるため、
    // テストは UTC で実行する（NFR-E-04）。
    env: { TZ: "UTC" },
  },
});
