/**
 * 共通ヘッダー（docs/03_screen_list.md 3.1）
 * デザイン：Figma の Header（node 4:48）
 * ログイン後のすべての画面の上部に表示する。
 */
import Link from "next/link";

import type { SessionUser } from "@/server/auth/session";

import { HeaderNav } from "./header-nav";
import { LogoutButton } from "./logout-button";

export function SiteHeader({ user }: { user: SessionUser }) {
  return (
    <header className="flex h-14 w-full items-center gap-3 border-b border-border bg-surface px-4 md:gap-8 md:px-8">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <span
          aria-hidden
          className="flex size-6 items-center justify-center rounded-md bg-primary text-[12px] leading-[18px] font-medium text-text-on-primary"
        >
          備
        </span>
        <span className="text-[16px] leading-6 font-bold text-text max-md:sr-only">
          備品貸出管理システム
        </span>
      </Link>

      <HeaderNav isAdmin={user.role === "admin"} />

      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <span className="truncate text-[14px] leading-[22px] text-text max-sm:sr-only">
          {user.name}（{user.department}）
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
