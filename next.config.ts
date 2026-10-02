import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // forbidden() で 403 を返すために必要（docs/screens/SCR-90_error.md）。
    // Next.js ではまだ experimental 扱いなので、バージョンを上げるときは動作を確認する。
    authInterrupts: true,
  },
};

export default nextConfig;
