/**
 * 認証のサービス層（docs/06_api_design.md 1章）。
 *
 * 業務ルールと DB アクセスだけを持ち、HTTP（Request / Response / Cookie）には依存しない。
 * Route Handler や画面からは、この層の関数を呼ぶ。
 */
import { prisma } from "@/lib/prisma";

import { verifyPassword } from "./password";
import { SESSION_TTL_MS, generateSessionToken, hashSessionToken, isSessionValid } from "./token";

export type SessionUser = {
  id: number;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  role: string;
};

const USER_FIELDS = {
  id: true,
  employeeCode: true,
  name: true,
  email: true,
  department: true,
  role: true,
} as const;

/**
 * メールアドレスとパスワードで社員を認証する。
 * 認証できなければ null を返す。存在しないメールとパスワード誤りを区別しない（BR-17）。
 */
export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  if (!(await verifyPassword(password, user.passwordHash))) return null;

  const {
    passwordHash: _passwordHash,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = user;
  return rest;
}

/**
 * セッションを発行する。DB にはトークンのハッシュだけを保存する（NFR-S-03）。
 * 返したトークンは Cookie に入れる（呼び出し側の責務）。
 */
export async function issueSession(
  userId: number,
  now: Date = new Date(),
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { tokenHash: hashSessionToken(token), userId, expiresAt },
  });

  return { token, expiresAt };
}

/** トークンから社員を引く。存在しない・期限切れなら null（NFR-S-04）。 */
export async function findUserBySessionToken(
  token: string,
  now: Date = new Date(),
): Promise<SessionUser | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: { expiresAt: true, user: { select: USER_FIELDS } },
  });

  if (!session || !isSessionValid(session.expiresAt, now)) return null;
  return session.user;
}

/** セッションを破棄する（ログアウト。NFR-S-04）。 */
export async function revokeSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
}
