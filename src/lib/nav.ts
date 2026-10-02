/**
 * 共通ヘッダーのメニュー定義（docs/03_screen_list.md 3.1）
 * 画面に依存しない部分だけを置く。見た目は src/components/header-nav.tsx。
 */
export type NavLink = { href: string; label: string };

/** 全員に見せるメニュー */
export const MEMBER_LINKS: NavLink[] = [
  { href: "/", label: "ホーム" },
  { href: "/equipment", label: "備品一覧" },
  { href: "/my/loans", label: "申請履歴" },
];

/** 管理者だけに見せるメニュー（NFR-S-06。画面を隠すだけでなく API 側でも権限を見る） */
export const ADMIN_LINKS: NavLink[] = [
  { href: "/admin", label: "管理ダッシュボード" },
  { href: "/admin/loans", label: "申請・貸出管理" },
  { href: "/admin/audit-logs", label: "操作履歴" },
];

/**
 * 表示中の画面に対応するメニューを1つだけ返す。
 * `/admin/loans` のときに `/admin` まで強調されないよう、最も長く一致するものを選ぶ。
 */
export function activeHref(pathname: string, links: NavLink[]): string | null {
  const matched = links.filter(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
  );
  if (matched.length === 0) return null;
  return matched.reduce((a, b) => (a.href.length >= b.href.length ? a : b)).href;
}
