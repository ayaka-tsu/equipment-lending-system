/**
 * POST /api/auth/logout — ログアウト（FR-02 / NFR-S-04）
 */
import { destroySession, getCurrentUser } from "@/server/auth/session";
import { checkOrigin } from "@/server/http/origin";
import { errorResponse, noContentResponse } from "@/server/http/response";

export async function POST(request: Request) {
  const originError = checkOrigin(request);
  if (originError) return originError;

  const user = await getCurrentUser();
  if (!user) return errorResponse("UNAUTHENTICATED");

  await destroySession();
  return noContentResponse();
}
