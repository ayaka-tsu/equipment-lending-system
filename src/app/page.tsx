export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-bold">備品貸出管理システム</h1>
      <p className="mt-2 text-text-secondary">
        開発環境の構築はここまでで完了です。画面の実装は Issue に沿って進めてください。
      </p>

      <section className="mt-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="font-bold">確認できていること</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-text-secondary">
          <li>Next.js（App Router）が起動している</li>
          <li>デザイントークン（色・角丸・フォント）が使える</li>
          <li>
            <code className="rounded-sm bg-subtle px-1">npm run db:migrate</code> と{" "}
            <code className="rounded-sm bg-subtle px-1">npm run db:seed</code> で DB が作れている
          </li>
        </ul>
      </section>

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
