/**
 * パスワードのハッシュ化と照合（NFR-S-02）。
 * 平文・可逆暗号・高速ハッシュ（MD5 / SHA-256 単体）は使わない。
 */
import bcrypt from "bcryptjs";

/** bcrypt のコスト。10 以上（NFR-S-02）。 */
const COST = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
