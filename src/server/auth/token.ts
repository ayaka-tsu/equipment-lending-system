/**
 * セッショントークンの生成と検証（NFR-S-03・S-04）。
 * HTTP にも DB にも依存しない、純粋な処理だけを置く。
 */
import { createHash, randomBytes } from "node:crypto";

/** 有効期限（ミリ秒）。ログインから8時間（NFR-S-04）。 */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** Cookie に入れるトークンを作る（32バイトの乱数）。 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** トークンから、DB に保存するハッシュ（SHA-256）を作る。 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** セッションが有効か（期限切れでないか）。 */
export function isSessionValid(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() > now.getTime();
}
