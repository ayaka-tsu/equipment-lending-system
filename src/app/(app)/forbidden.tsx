/**
 * SCR-90 エラー（403）（docs/03_screen_list.md 3.2、NFR-S-06）
 * 一般社員が管理者向けの画面を開いたときに、403 として表示する。
 *
 * 共通ヘッダーは (app)/layout.tsx が表示するので、ここでは本文だけを返す。
 */
import { ErrorScreen } from "@/components/error-screen";

export default function Forbidden() {
  return (
    <ErrorScreen
      code="403"
      title="このページを表示する権限がありません"
      description="管理者のみが利用できるページです。"
    />
  );
}
