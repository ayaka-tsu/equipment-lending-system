# ER図

| 項目           | 内容                |
| -------------- | ------------------- |
| 文書バージョン | 0.1（ドラフト）     |
| 作成日         | 2026-09-13          |
| 作成者         | 開発チーム リーダー |

## 改訂履歴

| 版  | 日付       | 内容     | 作成者   |
| --- | ---------- | -------- | -------- |
| 0.1 | 2026-09-13 | 初版作成 | リーダー |

---

## 1. ER図

カラムの詳細（桁数・制約・インデックス）は [05 テーブル定義書](05_table_definitions.md) を参照。

```mermaid
erDiagram
    users ||--o{ sessions : "ログインしている"
    users ||--o{ loans : "申請する（borrower_id）"
    users |o--o{ loans : "承認・却下する（reviewed_by）"
    users |o--o{ loans : "取り消す（cancelled_by）"
    users ||--o{ audit_logs : "操作する（actor_id）"
    categories ||--o{ equipment : "分類する"
    equipment ||--o{ loans : "貸し出される"

    users {
        integer id PK
        varchar employee_code UK "社員番号"
        varchar name "氏名"
        varchar email UK "メールアドレス"
        varchar password_hash "パスワードのハッシュ"
        varchar department "部署"
        varchar role "member / admin"
        timestamptz created_at
        timestamptz updated_at
    }

    sessions {
        varchar token_hash PK "トークンのSHA-256"
        integer user_id FK
        timestamptz expires_at "有効期限"
        timestamptz created_at
    }

    categories {
        integer id PK
        varchar name UK "カテゴリ名"
        integer sort_order "表示順"
        timestamptz created_at
        timestamptz updated_at
    }

    equipment {
        integer id PK
        varchar asset_code UK "管理番号"
        varchar name "備品名"
        integer category_id FK
        integer quantity "保有数"
        varchar storage_location "保管場所"
        varchar description "説明"
        varchar status "active / suspended"
        integer version "楽観ロック用"
        timestamptz deleted_at "論理削除"
        timestamptz created_at
        timestamptz updated_at
    }

    loans {
        integer id PK
        integer equipment_id FK
        integer borrower_id FK "申請者"
        varchar status "申請のステータス"
        varchar purpose "利用目的"
        date due_date "返却予定日"
        integer reviewed_by FK "承認・却下した管理者"
        timestamptz reviewed_at
        varchar reject_reason "却下理由"
        timestamptz lent_at "貸出日時"
        timestamptz returned_at "返却日時"
        integer cancelled_by FK "取り消した人"
        timestamptz cancelled_at
        timestamptz created_at "申請日時"
        timestamptz updated_at
    }

    audit_logs {
        integer id PK
        integer actor_id FK "操作者"
        varchar action "操作種別"
        varchar target_type "equipment / loan"
        integer target_id "対象のID（外部キーなし）"
        jsonb detail "操作の内容"
        timestamptz created_at "操作日時"
    }
```

---

## 2. 設計上の判断

| No  | 判断                                                                      | 理由                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 在庫数（貸出可能数）をカラムに持たず、申請の件数から毎回計算する          | 在庫数を別に持つと、申請の件数と食い違う可能性がある。データの正は `loans` だけにする（BR-01）。                                                                     |
| 2   | 延滞をステータスとして保存しない                                          | 延滞は「日付が変わった」だけで発生するため、保存するとバッチ処理で更新し続ける必要がある。表示のたびに判定する（BR-06）。                                            |
| 3   | 申請から返却までを `loans` の1行で表し、各段階の日時をカラムに持つ        | 1件の貸出に起きる出来事は最大4つ（申請・承認・貸出・返却）で固定のため。「誰が操作したか」の完全な記録は `audit_logs` に任せる。                                     |
| 4   | 備品は論理削除（`deleted_at`）にする                                      | 過去の貸出申請が参照しているため、行を消すと貸出の記録が壊れる。                                                                                                     |
| 5   | 備品の同時編集は `version` カラムで検出する（楽観ロック）                 | 更新日時（`updated_at`）での比較は、PostgreSQL がマイクロ秒、JavaScript の `Date` がミリ秒で精度が異なり、一致判定を誤るため使わない。                               |
| 6   | `audit_logs.target_id` には外部キー制約を付けない                         | 対象が備品か申請かを `target_type` で切り替える（ポリモーフィック関連）ため、1つの外部キーでは表せない。操作履歴は削除も変更もしないので、参照先が消える心配もない。 |
| 7   | 操作履歴の `detail` に、操作した時点の備品名などを残す                    | 備品名が後で変わっても、「そのとき何に対して操作したか」が分かるようにするため。                                                                                     |
| 8   | ステータスは PostgreSQL の ENUM 型ではなく、`varchar` と CHECK 制約で表す | 値を追加するマイグレーションが簡単なため。                                                                                                                           |
