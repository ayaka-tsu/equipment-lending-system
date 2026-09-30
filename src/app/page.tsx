/**
 * ホーム（暫定）。
 * SCR-02 ホームの実装は ISSUE-11、共通ヘッダーは ISSUE-03 で行う。
 * いまはログイン状態が画面から確認できるよう、利用者名とログアウトだけを置いている。
 */
import Link from "next/link";

import { getCurrentUser } from "@/server/auth/session";

import { LogoutButton } from "./logout-button";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-bold">備品貸出管理システム</h1>

      {user ? (
        <section className="mt-6 flex items-center justify-between rounded-lg border border-border bg-surface p-6">
          <div>
            <p className="text-sm text-text-secondary">ログイン中</p>
            <p className="font-bold">
              {user.name}（{user.department}）
            </p>
            <p className="text-sm text-text-secondary">
              {user.email} ／ 権限：{user.role === "admin" ? "管理者" : "一般社員"}
            </p>
          </div>
          <LogoutButton />
        </section>
      ) : (
        <section className="mt-6 rounded-lg border border-border bg-surface p-6">
          <p className="text-text-secondary">ログインしていません。</p>
          <Link href="/login" className="mt-3 inline-block text-primary underline">
            ログイン画面へ
          </Link>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-border bg-surface p-6">
        <h2 className="font-bold">仕様書</h2>
        <p className="mt-3 text-text-secondary">
          リポジトリの <code className="rounded-sm bg-subtle px-1">docs/</code>{" "}
          を参照してください。担当 Issue に書かれた要件ID（FR-xx / BR-xx）と画面ID（SCR-xx）から、
          必要な仕様をたどれます。
        </p>
      </section>
    </main>
  );
}
