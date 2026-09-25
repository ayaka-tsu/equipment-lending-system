/**
 * CSRF 対策の Origin 検証（NFR-S-11 / docs/06_api_design.md 2.3）。
 *
 * 更新系（POST・PATCH・DELETE）のリクエストで、`Origin` ヘッダが
 * アプリケーション自身のオリジンと一致しない場合は 403 を返す。
 * ブラウザからの fetch では常に `Origin` が送られるため、
 * ヘッダが無い場合も「一致しない」として扱う。
 */
import { errorResponse } from "./response";

/** 検証に成功したら null、失敗したら 403 のレスポンスを返す。 */
export function checkOrigin(request: Request): Response | null {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;

  const allowed = process.env.APP_ORIGIN;
  if (!allowed) {
    throw new Error("環境変数 APP_ORIGIN が設定されていません（.env.example を参照）");
  }

  const origin = request.headers.get("origin");
  if (origin !== allowed) {
    return errorResponse("FORBIDDEN");
  }
  return null;
}
