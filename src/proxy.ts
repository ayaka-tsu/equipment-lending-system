/**
 * リクエストの手前で行う共通処理（docs/03_screen_list.md 3.2、FR-03）
 *
 * Next.js 16 では middleware.ts ではなく proxy.ts を使う。
 *
 * ここでは Cookie があるかどうかしか見ない（DB を引けないため）。
 * 期限切れ・取り消し済みのセッションは src/app/(app)/layout.tsx ではじく。
 * この二段構えは Next.js の認証ガイド（Optimistic checks）に従っている。
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** ログインしていなくても開ける画面 */
const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!PUBLIC_PATHS.includes(pathname) && !request.cookies.has("session_token")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ログアウト後に戻るボタンで前の画面に戻っても、キャッシュから表示されないようにする
  const response = NextResponse.next();
  if (!PUBLIC_PATHS.includes(pathname)) {
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }
  return response;
}

export const config = {
  // API（401 を JSON で返す）と静的ファイルは対象外にする
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
