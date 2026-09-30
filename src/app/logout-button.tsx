"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * 暫定のログアウトボタン。
 * ISSUE-03 で共通ヘッダー（SCR-01〜SCR-12 共通仕様 3.1）を作ったら、そちらへ移す。
 */
export function LogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={submitting}
      className="rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-medium hover:bg-subtle disabled:opacity-40"
    >
      {submitting ? "送信中…" : "ログアウト"}
    </button>
  );
}
