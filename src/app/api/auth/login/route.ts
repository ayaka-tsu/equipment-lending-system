/**
 * POST /api/auth/login — ログイン（FR-01 / BR-17）
 * docs/06_api_design.md、docs/api/openapi.yaml
 */
import { z } from "zod";

import { verifyPassword } from "@/server/auth/password";
import { createSession, getCurrentUser } from "@/server/auth/session";
import { checkOrigin } from "@/server/http/origin";
import { errorResponse, jsonResponse, readJsonBody } from "@/server/http/response";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z
    .string({ error: "メールアドレスを入力してください" })
    .trim()
    .min(1, "メールアドレスを入力してください")
    .max(255, "メールアドレスは255文字以内で入力してください")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "メールアドレスの形式が正しくありません"),
  password: z
    .string({ error: "パスワードを入力してください" })
    .min(1, "パスワードを入力してください")
    .max(128, "パスワードは128文字以内で入力してください"),
});

export async function POST(request: Request) {
  const originError = checkOrigin(request);
  if (originError) return originError;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = loginSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", {
      details: parsed.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? ""),
        message: issue.message,
      })),
    });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // 存在しないメールアドレスでも、パスワードが違う場合と同じ応答にする（BR-17）
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return errorResponse("INVALID_CREDENTIALS");
  }

  await createSession(user.id);

  const loggedIn = await getCurrentUser();
  return jsonResponse(
    loggedIn ?? {
      id: user.id,
      employeeCode: user.employeeCode,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
    },
  );
}
