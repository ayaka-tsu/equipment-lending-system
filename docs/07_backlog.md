# 開発計画（Issue 一覧）

| 項目           | 内容                |
| -------------- | ------------------- |
| 文書バージョン | 0.1（ドラフト）     |
| 作成日         | 2026-09-20          |
| 作成者         | 開発チーム リーダー |

## 改訂履歴

| 版  | 日付       | 内容     | 作成者   |
| --- | ---------- | -------- | -------- |
| 0.1 | 2026-09-20 | 初版作成 | リーダー |

---

## 1. Issue 一覧

各 Issue の本文は [docs/issues/](issues/) にある。GitHub の Issue には、この本文をそのまま貼る。

| ID                                              | タイトル                                   | 優先度 | 見積もり | 前提 | 主な要件                 |
| ----------------------------------------------- | ------------------------------------------ | ------ | -------- | ---- | ------------------------ |
| [ISSUE-01](issues/ISSUE-01_setup.md)            | 開発環境を構築する                         | Must   | 4h       | -    | -                        |
| [ISSUE-02](issues/ISSUE-02_auth.md)             | ログイン・ログアウト                       | Must   | 8h       | 01   | FR-01・02                |
| [ISSUE-03](issues/ISSUE-03_layout.md)           | 共通レイアウトとアクセス制御               | Must   | 6h       | 02   | FR-03                    |
| [ISSUE-04](issues/ISSUE-04_equipment_list.md)   | 備品一覧・検索                             | Must   | 8h       | 03   | FR-10、BR-01             |
| [ISSUE-05](issues/ISSUE-05_equipment_detail.md) | 備品詳細                                   | Must   | 5h       | 04   | FR-11                    |
| [ISSUE-06](issues/ISSUE-06_equipment_admin.md)  | 備品の登録・編集・削除（管理者）           | Must   | 9h       | 05   | FR-12〜14、BR-11〜14     |
| [ISSUE-07](issues/ISSUE-07_loan_request.md)     | 貸出申請                                   | Must   | 9h       | 05   | FR-20、BR-01〜05         |
| [ISSUE-08](issues/ISSUE-08_my_loans.md)         | 自分の申請一覧・申請詳細                   | Must   | 7h       | 07   | FR-21・22                |
| [ISSUE-09](issues/ISSUE-09_loan_actions.md)     | 申請の取消・承認・却下・貸出記録・返却記録 | Must   | 9h       | 08   | FR-23〜27、BR-07〜09・16 |
| [ISSUE-10](issues/ISSUE-10_admin_loans.md)      | 申請・貸出管理一覧（管理者）               | Must   | 7h       | 09   | FR-28                    |
| [ISSUE-11](issues/ISSUE-11_home.md)             | ホーム                                     | Must   | 5h       | 08   | FR-30                    |
| [ISSUE-12](issues/ISSUE-12_dashboard.md)        | 管理ダッシュボード                         | Should | 6h       | 10   | FR-31                    |
| [ISSUE-13](issues/ISSUE-13_audit_logs.md)       | 操作履歴の閲覧                             | Should | 6h       | 09   | FR-33                    |
| [ISSUE-14](issues/ISSUE-14_deploy.md)           | 本番環境へのデプロイ                       | Must   | 4h       | 11   | NFR-M-06                 |

- 操作履歴への**記録**（FR-32、BR-14）は独立した Issue にせず、ISSUE-06・07・09 の受入条件に入れている。
- 見積もりは、初学者がレビューの指摘を直す時間まで含めた目安。

## 2. 見積もりと期間

| 区分                   | 合計    |
| ---------------------- | ------- |
| Must（12件）           | **81h** |
| Should（ISSUE-12・13） | 12h     |
| 合計                   | 93h     |

開発できる期間は 2026-09-20 〜 10-31 の 42 日。1日2時間として、

| 進め方        | 使える時間 | Must（81h）が終わるか           |
| ------------- | ---------- | ------------------------------- |
| 毎日2時間     | 約84h      | ぎりぎり終わる（余裕はない）    |
| 平日だけ2時間 | 約60h      | 終わらない（ISSUE-09 前後まで） |

祝日や体調を考えると、**Must をすべて終えるのは楽な計画ではない**。次のどれかで調整する。

1. ISSUE-12・13（Should）は最初から外す → Must だけに集中する
2. 進みが遅れたら ISSUE-10 を縮める（延滞の絞り込みだけにする）
3. レビュー待ちの間に次の Issue へ進む（ただし同時に2本までにする）

**判断のタイミング：10/17 時点で ISSUE-08 が終わっていなければ、ISSUE-10 以降を削る。**

## 3. 週ごとの目安（毎日2時間の場合）

| 週  | 期間         | Issue  | 時間       |
| --- | ------------ | ------ | ---------- |
| 1   | 9/20〜9/26   | 01, 02 | 12h        |
| 2   | 9/27〜10/3   | 03, 04 | 14h        |
| 3   | 10/4〜10/10  | 05, 06 | 14h        |
| 4   | 10/11〜10/17 | 07, 08 | 16h        |
| 5   | 10/18〜10/24 | 09, 10 | 16h        |
| 6   | 10/25〜10/31 | 11, 14 | 9h ＋ 予備 |

Should の2件は、余裕ができた週に差し込む。

## 4. 進め方のルール

- 着手する Issue は**原則1本**。レビュー待ちの間だけ、次の Issue を始めてよい（同時に2本まで）。
- 着手前に仕様を読み、分からない点は先に質問する（[CONTRIBUTING](../CONTRIBUTING.md)）。
- レビューはリーダーが**翌営業日までに**返す。返ってこない場合は催促してよい。
- 1つの PR に複数の Issue を混ぜない。

## 5. Issue を GitHub に登録する（リーダー作業）

ラベルを作る。

```bash
gh label create "type:feature" --color 0E8A16 --description "機能の実装"
gh label create "type:bug" --color D73A4A --description "不具合"
gh label create "type:question" --color D4C5F9 --description "仕様確認"
gh label create "priority:must" --color B60205 --description "リリースに必須"
gh label create "priority:should" --color FBCA04 --description "できる限り入れる"
gh label create "area:ui" --color 1D76DB --description "画面"
gh label create "area:api" --color 5319E7 --description "API・サーバー側"
gh label create "area:db" --color 006B75 --description "DB・マイグレーション"
```

Issue をまとめて作る。本文の1行目（見出し）をタイトルにし、残りを本文にする。

```bash
for f in docs/issues/ISSUE-*.md; do
  title=$(head -1 "$f" | sed 's/^# //')
  gh issue create --title "$title" --body "$(tail -n +2 "$f")" --label "type:feature"
done
```

作成後に、ISSUE-12・13 だけ `priority:should`、それ以外に `priority:must` を付ける。
