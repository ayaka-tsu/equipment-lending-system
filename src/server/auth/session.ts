/**
 * セッションの発行・検証・破棄（FR-01・FR-02 / NFR-S-03・S-04）。
 *
 * - トークンは 32 バイトの乱数。Cookie に入れる。
 * - DB には SHA-256 のハッシュだけを保存する（トークンそのものは保存しない）。
 * - 有効期限はログインから 8 時間。
 */
import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "session_token";

/** 有効期限（ミリ秒）。ログインから8時間（NFR-S-04）。 */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export type SessionUser = {
  id: number;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  role: string;
};

/** Cookie に入れるトークンを作る。 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** トークンから、DB に保存するハッシュを作る。 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** セッションが有効か（期限切れでないか）を判定する。 */
export function isSessionValid(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() > now.getTime();
}

/** Cookie の属性（NFR-S-03）。本番のみ Secure を付ける。 */
export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  };
}

/** セッションを作り、Cookie を設定する。 */
export async function createSession(userId: number, now: Date = new Date()): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { tokenHash: hashSessionToken(token), userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(expiresAt));
}

/** ログイン中の社員を返す。未ログイン・期限切れなら null。 */
export async function getCurrentUser(now: Date = new Date()): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          employeeCode: true,
          name: true,
          email: true,
          department: true,
          role: true,
        },
      },
    },
  });

  if (!session || !isSessionValid(session.expiresAt, now)) return null;
  return session.user;
}

/** ログアウト。セッションを DB から削除し、Cookie も消す（NFR-S-04）。 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
