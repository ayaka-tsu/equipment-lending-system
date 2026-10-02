"use client";

/**
 * 画面から API を呼ぶときの共通処理（docs/03_screen_list.md 3.2・3.8）
 *
 * 401（セッション切れ）が返ったら、その場でログイン画面へ移動する。
 * 各画面で 401 の処理を書かなくて済むよう、画面からの API 呼び出しはここを通す。
 *
 *   const apiFetch = useApiFetch();
 *   const response = await apiFetch("/api/loans", { method: "POST", ... });
 *
 * ログイン画面だけは例外で、401 が「メールかパスワードが違う」を意味するため
 * この関数を使わず fetch を直接呼ぶ。
 */
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const EXPIRED_LOGIN_URL = "/login?reason=expired";

export function useApiFetch() {
  const router = useRouter();

  return useCallback(
    async (input: string, init?: RequestInit): Promise<Response> => {
      const response = await fetch(input, init);

      if (response.status === 401) {
        router.replace(EXPIRED_LOGIN_URL);
        router.refresh();
      }

      return response;
    },
    [router],
  );
}
