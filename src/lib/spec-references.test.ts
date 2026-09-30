/**
 * コード中の仕様への参照が、腐っていないことを確かめる。
 *
 * コメントに書いた文書のパス（docs/...）と要件ID（FR-xx / BR-xx / NFR-X-xx / SCR-xx）が、
 * 実際に docs/ に存在することを検査する。リンク切れはレビューではなくテストで落とす。
 *
 * 対象は `src/` と `e2e/`。E2E のテスト名にも要件IDを書くため、同じ検査をかける。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");

function listFiles(dir: string, filter: (path: string) => boolean): string[] {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listFiles(full, filter);
    return filter(full) ? [full] : [];
  });
}

const sourceFiles = ["src", "e2e"].flatMap((dir) =>
  listFiles(join(ROOT, dir), (p) => /\.tsx?$/.test(p)),
);
const sources = sourceFiles.map((path) => ({ path, text: readFileSync(path, "utf-8") }));

const docsText = listFiles(join(ROOT, "docs"), (p) => p.endsWith(".md"))
  .map((p) => readFileSync(p, "utf-8"))
  .join("\n");

describe("コード中の仕様への参照", () => {
  it("コメントに書いた docs/ のパスが実在する", () => {
    const missing: string[] = [];
    for (const { path, text } of sources) {
      for (const match of text.matchAll(/docs\/[\w./-]+\.(?:md|yaml)/g)) {
        try {
          statSync(join(ROOT, match[0]));
        } catch {
          missing.push(`${path.replace(ROOT + "/", "")} -> ${match[0]}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("コメントに書いた要件ID・画面IDが docs/ で定義されている", () => {
    const unknown: string[] = [];
    for (const { path, text } of sources) {
      if (path.endsWith("spec-references.test.ts")) continue;
      for (const match of text.matchAll(/\b(?:FR|BR|SCR)-\d{2}\b|\bNFR-[A-Z]-\d{2}\b/g)) {
        if (!docsText.includes(match[0])) {
          unknown.push(`${path.replace(ROOT + "/", "")} -> ${match[0]}`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });
});
