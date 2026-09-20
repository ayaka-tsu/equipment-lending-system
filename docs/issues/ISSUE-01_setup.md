# ISSUE-01 開発環境を構築する

| 項目     | 内容                      |
| -------- | ------------------------- |
| 見積もり | 4h                        |
| 前提     | なし                      |
| 優先度   | Must                      |
| ラベル   | `type:feature`, `area:db` |

## 概要

README のとおりに開発環境を作り、アプリと DB が動く状態にする。あわせて、詰まったところを README に反映して、Issue → ブランチ → PR → レビュー → マージの流れを一度通す。

## 対象の仕様

- [README](../../README.md) の「2〜4」
- [CONTRIBUTING](../../CONTRIBUTING.md)

## やること

- [ ] README の手順どおりに環境を作る（WSL2／Docker／Node.js／リポジトリのクローン）
- [ ] `docker compose up -d` で DB が `healthy` になることを確認する
- [ ] `npm ci` → `npm run db:migrate` → `npm run db:seed` を実行する
- [ ] `npm run dev` で http://localhost:3000 が表示されることを確認する
- [ ] `npm run lint` `npm run typecheck` `npm test` が通ることを確認する
- [ ] `docker compose exec db psql -U app -d equipment_lending` でつなぎ、`\dt` でテーブルが6つあることを確認する
- [ ] 詰まった箇所・README と違った箇所を README に追記する PR を出す（詰まらなかった場合は「追記なし」と PR に書く）

## 受入条件

- [ ] PR に、`npm run dev` で表示した画面のスクリーンショットが貼られている
- [ ] PR に、`psql` で `\dt` を実行した結果が貼られている
- [ ] ブランチ名・コミットメッセージ・PR テンプレートの書き方が CONTRIBUTING に沿っている

## 実装の手がかり

- Windows の場合、リポジトリは必ず WSL のホームディレクトリ（`~/dev`）に置く。`/mnt/c` に置くと動作が遅くなる。
- `npm run db:seed` のログに件数が出る。`{ categories: 6, users: 10, equipment: 30, loans: 12, auditLogs: 22 }` になっていれば成功。

## この Issue でやらないこと

- 画面やコードの実装
