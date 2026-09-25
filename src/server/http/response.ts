/**
 * API の共通レスポンス（docs/06_api_design.md 2.9・2.10）。
 * エラーはすべてこの形で返す：{ "error": { "code", "message", "details"? } }
 */

export const ERROR_CODES = {
  BAD_REQUEST: { status: 400, message: "リクエストの形式が正しくありません。" },
  UNAUTHENTICATED: { status: 401, message: "ログインが必要です。" },
  INVALID_CREDENTIALS: {
    status: 401,
    message: "メールアドレスまたはパスワードが正しくありません。",
  },
  FORBIDDEN: { status: 403, message: "この操作を行う権限がありません。" },
  SELF_REVIEW_FORBIDDEN: { status: 403, message: "自分の申請は承認・却下できません。" },
  NOT_FOUND: { status: 404, message: "対象のデータが見つかりません。" },
  VALIDATION_ERROR: { status: 422, message: "入力内容に誤りがあります。" },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: "サーバーでエラーが発生しました。時間をおいて再度お試しください。",
  },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export type ValidationDetail = { field: string; message: string };

/** エラーレスポンスを作る。message を渡すと既定の文言を上書きする。 */
export function errorResponse(
  code: ErrorCode,
  options: { message?: string; details?: ValidationDetail[] } = {},
): Response {
  const { status, message } = ERROR_CODES[code];
  return Response.json(
    {
      error: {
        code,
        message: options.message ?? message,
        ...(options.details ? { details: options.details } : {}),
      },
    },
    { status },
  );
}

/** 正常系のレスポンス。 */
export function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

/** 本文なしの正常系（ログアウト・削除）。 */
export function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}

/** リクエスト本文を JSON として読む。読めなければ BAD_REQUEST を返す。 */
export async function readJsonBody(
  request: Request,
): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return { ok: false, response: errorResponse("BAD_REQUEST") };
  }
}
