/**
 * E2E から DB を直接見るための補助。
 *
 * 画面だけでは確かめられないこと（トークンのハッシュしか保存していない、
 * ログアウトでセッションの行が消える、期限切れの扱い）を確かめるために使う。
 *
 * アプリの Prisma Client は使わず、SQL で見る。
 * 実装が正しいかを外側から確かめたいので、確かめる側が実装を借りないようにしている。
 */
import { createHash } from "node:crypto";

import { Client } from "pg";

export type SessionRow = {
  token_hash: string;
  user_id: number;
  expires_at: Date;
  created_at: Date;
};

/** セッショントークンのハッシュ（SHA-256。NFR-S-03、docs/05_table_definitions.md）。 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function withClient<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("環境変数 DATABASE_URL が設定されていません（.env.example を参照）");
  }
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

/** Cookie のトークンから、対応する sessions の行を引く。 */
export async function findSessionByToken(token: string): Promise<SessionRow | null> {
  return withClient(async (client) => {
    const result = await client.query<SessionRow>(
      "SELECT token_hash, user_id, expires_at, created_at FROM sessions WHERE token_hash = $1",
      [hashToken(token)],
    );
    return result.rows[0] ?? null;
  });
}

/** sessions にトークンそのものが入っていないことを確かめるために使う（NFR-S-03）。 */
export async function countSessionsWithRawToken(token: string): Promise<number> {
  return withClient(async (client) => {
    const result = await client.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM sessions WHERE token_hash = $1",
      [token],
    );
    return Number(result.rows[0].count);
  });
}

/** セッションを期限切れにする。8時間待たずに期限切れの挙動を確かめるため。 */
export async function expireSession(token: string): Promise<void> {
  await withClient(async (client) => {
    const result = await client.query(
      "UPDATE sessions SET expires_at = now() - interval '1 second' WHERE token_hash = $1",
      [hashToken(token)],
    );
    if (result.rowCount !== 1) {
      throw new Error(`期限切れにする対象のセッションが見つかりません（${result.rowCount} 行）`);
    }
  });
}
