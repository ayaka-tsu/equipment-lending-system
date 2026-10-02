"use client";

/**
 * SCR-90 エラー（500）（docs/screens/SCR-90_error.md）
 *
 * ここはクライアントコンポーネントのため、共通ヘッダーは出さない。
 * 画面に詳細は出さず、サーバーのログで原因を追う（NFR-S-12 / NFR-M-01）。
 */
import { ErrorScreen } from "@/components/error-screen";

export default function GlobalError() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <ErrorScreen
        code="500"
        title="エラーが発生しました"
        description="時間をおいて再度お試しください。問題が続く場合は総務部へお問い合わせください。"
      />
    </div>
  );
}
