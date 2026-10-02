/**
 * SCR-90 エラー（404）（docs/03_screen_list.md 3.2）
 * ログインしている場合は共通ヘッダーを表示する。
 */
import { ErrorScreen } from "@/components/error-screen";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/server/auth/session";

export default async function NotFound() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-page">
      {user && <SiteHeader user={user} />}
      <ErrorScreen
        code="404"
        title="ページが見つかりません"
        description="URL が正しいか確認してください。"
      />
    </div>
  );
}
