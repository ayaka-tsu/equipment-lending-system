/**
 * SCR-90 エラー（docs/screens/SCR-90_error.md）
 * デザイン：Figma の SCR-90 エラー（404：node 11:759／403：node 11:784）
 *
 * 500 のときもスタックトレースや詳細は表示しない（NFR-S-12）。
 */
import Link from "next/link";

export function ErrorScreen({
  code,
  title,
  description,
}: {
  code: "403" | "404" | "500";
  title: string;
  description: string;
}) {
  return (
    <main className="flex w-full flex-col items-center justify-center gap-3 px-6 pt-[200px] pb-16 md:px-[120px]">
      <p className="text-[32px] leading-10 font-bold text-text-muted">{code}</p>
      <p className="text-center text-[20px] leading-[30px] font-bold text-text">{title}</p>
      <p className="text-center text-[14px] leading-[22px] text-text-secondary">{description}</p>
      <div aria-hidden className="h-3" />
      <Link
        href="/"
        className="rounded-md border border-border-strong bg-surface px-4 py-2 text-[14px] leading-[22px] font-medium text-text hover:bg-subtle"
      >
        ホームへ戻る
      </Link>
    </main>
  );
}
