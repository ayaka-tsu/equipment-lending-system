/**
 * ログイン後の共通レイアウト（docs/03_screen_list.md 3.1・3.2、FR-03）
 *
 * ここがログイン状態の「本物の確認」を行う場所。
 * proxy.ts は Cookie があるかどうかしか見ていないので、
 * 期限切れ・取り消し済みのセッションはここではじく（NFR-S-04）。
 */
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { FlashMessage } from "@/components/flash-message";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/server/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?reason=expired");

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <SiteHeader user={user} />
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-8">
        <Suspense fallback={null}>
          <FlashMessage />
        </Suspense>
        {children}
      </div>
    </div>
  );
}
