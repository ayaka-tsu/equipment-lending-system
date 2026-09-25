/**
 * SCR-01 ログイン（docs/screens/SCR-01_login.md）
 * ログイン済みの利用者が開いた場合はホームへ送る。
 */
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { reason } = await searchParams;

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-40">
      <div className="w-full max-w-100 rounded-xl border border-border bg-surface px-8 py-10 shadow-sm">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-bold">備品貸出管理システム</h1>
          <p className="text-xs text-text-muted">株式会社ノースブリッジ</p>
        </div>
        <LoginForm sessionExpired={reason === "expired"} />
      </div>
    </main>
  );
}
