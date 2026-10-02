"use client";

/**
 * 共通ヘッダーのメニュー（docs/03_screen_list.md 3.1）
 * デザイン：Figma の NavItem（node 4:6）。表示中の画面は active。
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_LINKS, MEMBER_LINKS, activeHref } from "@/lib/nav";
import type { NavLink } from "@/lib/nav";

export function HeaderNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...MEMBER_LINKS, ...ADMIN_LINKS] : MEMBER_LINKS;
  const current = activeHref(pathname, links);

  return (
    <nav
      aria-label="メインメニュー"
      className="flex min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap"
    >
      {MEMBER_LINKS.map((link) => (
        <NavItem key={link.href} link={link} active={link.href === current} />
      ))}
      {isAdmin && (
        <>
          <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border-strong" />
          {ADMIN_LINKS.map((link) => (
            <NavItem key={link.href} link={link} active={link.href === current} />
          ))}
        </>
      )}
    </nav>
  );
}

function NavItem({ link, active }: { link: NavLink; active: boolean }) {
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "flex h-14 shrink-0 items-center justify-center border-b-2 border-primary px-3 text-[14px] leading-[22px] font-medium text-primary"
          : "flex h-14 shrink-0 items-center justify-center px-3 text-[14px] leading-[22px] text-text-secondary hover:text-text"
      }
    >
      {link.label}
    </Link>
  );
}
