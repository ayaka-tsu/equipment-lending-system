"use client";

/**
 * 成功メッセージの共通表示（docs/03_screen_list.md 3.8）
 *
 * メッセージは URL のクエリ `?message=` に入れて渡す。
 * 一覧の検索条件と同じで、URL に状態を持たせると別の画面へ移動した時点で消える。
 *
 *   router.push(`/my/loans?message=${encodeURIComponent("申請を取り消しました")}`);
 */
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Alert } from "./alert";

export const FLASH_PARAM = "message";

export function FlashMessage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const message = searchParams.get(FLASH_PARAM);

  if (!message) return null;

  function handleClose() {
    const params = new URLSearchParams(searchParams);
    params.delete(FLASH_PARAM);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="mb-6">
      <Alert tone="success" onClose={handleClose}>
        {message}
      </Alert>
    </div>
  );
}
