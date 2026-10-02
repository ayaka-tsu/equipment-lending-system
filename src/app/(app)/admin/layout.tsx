/**
 * 管理者向け画面の共通レイアウト（docs/03_screen_list.md 3.2、NFR-S-06）
 *
 * 一般社員が /admin 以下を開いたら 403 を表示する。
 * これは画面側の制御。API 側でも同じ判定を行う（src/server/http/auth-guard.ts）。
 */
import { forbidden } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") forbidden();

  return children;
}
