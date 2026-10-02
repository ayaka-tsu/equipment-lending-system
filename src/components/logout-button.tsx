"use client";

/**
 * ログアウト（docs/03_screen_list.md 3.1、FR-02）
 * 確認ダイアログは出さない。
 */
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
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
      className="shrink-0 cursor-pointer rounded-md border border-border-strong bg-surface px-4 py-2 text-[14px] leading-[22px] font-medium text-text hover:bg-subtle disabled:opacity-40"
    >
      {submitting ? "送信中…" : "ログアウト"}
    </button>
  );
}
