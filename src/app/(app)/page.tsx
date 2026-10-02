/**
 * SCR-02 ホーム（docs/screens/SCR-02_home.md）
 * 中身は ISSUE-11 で作る。ここでは共通レイアウトの確認用に枠だけ置いている。
 */
import { getCurrentUser } from "@/server/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main>
      <h1 className="text-[20px] leading-[30px] font-bold text-text">ホーム</h1>
      <section className="mt-6 rounded-lg border border-border bg-surface p-6">
        <p className="text-[14px] leading-[22px] text-text-secondary">
          権限：{user?.role === "admin" ? "管理者" : "一般社員"}
        </p>
        <p className="mt-3 text-[14px] leading-[22px] text-text-secondary">
          この画面の中身は ISSUE-11 で作ります。担当 Issue に書かれた要件ID（FR-xx /
          BR-xx）と画面ID（SCR-xx）から、
          <code className="mx-1 rounded-sm bg-subtle px-1">docs/</code>
          の仕様をたどれます。
        </p>
      </section>
    </main>
  );
}
