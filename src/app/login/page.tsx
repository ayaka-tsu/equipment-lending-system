/**
 * SCR-01 ログイン（FR-01）
 * デザイン：Figma の SCR-01 ログイン（node 5:2）／ログイン失敗（node 5:29）
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
    <main className="flex min-h-screen flex-col items-center bg-page px-[120px] pt-[160px] pb-[64px]">
      <div className="flex w-[400px] flex-col gap-5 rounded-[12px] border border-border bg-surface px-8 py-10 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[20px] leading-[30px] font-bold text-text">備品貸出管理システム</p>
          <p className="text-[12px] leading-[18px] text-text-muted">株式会社ノースブリッジ</p>
        </div>
        <LoginForm sessionExpired={reason === "expired"} />
      </div>
    </main>
  );
}
