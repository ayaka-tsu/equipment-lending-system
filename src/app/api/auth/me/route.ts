/**
 * GET /api/auth/me — ログイン中の社員の情報（FR-03）
 */
import { getCurrentUser } from "@/server/auth/session";
import { errorResponse, jsonResponse } from "@/server/http/response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return errorResponse("UNAUTHENTICATED");
  return jsonResponse(user);
}
