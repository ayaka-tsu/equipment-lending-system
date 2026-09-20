# テーブル定義書

| 項目           | 内容                |
| -------------- | ------------------- |
| DBMS           | PostgreSQL 17       |
| 文書バージョン | 0.1（ドラフト）     |
| 作成日         | 2026-09-13          |
| 作成者         | 開発チーム リーダー |

## 改訂履歴

| 版  | 日付       | 内容     | 作成者   |
| --- | ---------- | -------- | -------- |
| 0.1 | 2026-09-13 | 初版作成 | リーダー |

---

## 1. 共通ルール

| 項目                                 | ルール                                                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 名前の付け方                         | テーブル名・カラム名はスネークケース（例：`asset_code`）。テーブル名は複数形。ただし `equipment` は不可算名詞のため単数形のまま使う。           |
| 主キー                               | 原則として `id integer` の自動採番（Prisma の `@default(autoincrement())`。PostgreSQL 上は `serial`＝シーケンス）。                             |
| 日時                                 | `timestamptz` を使う（`timestamp` は使わない）。                                                                                                |
| 日付                                 | 返却予定日のように時刻を持たない値は `date` を使う。日本時間の暦日として扱う。                                                                  |
| 作成日時・更新日時                   | `created_at`・`updated_at` は `NOT NULL DEFAULT now()`。`updated_at` は行を更新するたびにアプリケーションで現在時刻を入れる。                   |
| 文字列の前後の空白                   | アプリケーションで取り除いてから保存する。                                                                                                      |
| 制約の名前                           | 主キー `pk_テーブル`、外部キー `fk_テーブル_カラム`、一意 `uq_テーブル_カラム`、CHECK `chk_テーブル_内容`、インデックス `idx_テーブル_カラム`。 |
| スキーマの変更                       | マイグレーションファイルで行う（NFR-M-08）。テーブルは `prisma/schema.prisma` で定義する。                                                      |
| CHECK 制約と部分ユニークインデックス | `schema.prisma` では表現できないため、マイグレーションの SQL（`prisma/migrations/*/migration.sql`）に直接書く。                                 |

凡例：PK＝主キー、FK＝外部キー、UQ＝一意制約、NN＝NOT NULL

---

## 2. テーブル一覧

| No  | 物理名       | 論理名     | 概要                         |
| --- | ------------ | ---------- | ---------------------------- |
| 1   | `users`      | 社員       | ログインする社員とそのロール |
| 2   | `sessions`   | セッション | ログイン中のセッション       |
| 3   | `categories` | カテゴリ   | 備品の分類                   |
| 4   | `equipment`  | 備品       | 貸し出す備品                 |
| 5   | `loans`      | 貸出申請   | 申請から返却までの1件の貸出  |
| 6   | `audit_logs` | 操作履歴   | 誰が・いつ・何をしたかの記録 |

---

## 3. テーブル定義

### 3.1 users（社員）

| No  | 論理名             | 物理名          | 型           | NN  | デフォルト | 制約  | 備考                                                         |
| --- | ------------------ | --------------- | ------------ | --- | ---------- | ----- | ------------------------------------------------------------ |
| 1   | ID                 | `id`            | integer      | ○   | IDENTITY   | PK    |                                                              |
| 2   | 社員番号           | `employee_code` | varchar(10)  | ○   |            | UQ    | 例：`E0012`                                                  |
| 3   | 氏名               | `name`          | varchar(50)  | ○   |            |       | 例：`山田 太郎`                                              |
| 4   | メールアドレス     | `email`         | varchar(255) | ○   |            | UQ    | 小文字にそろえて保存する。ログイン時も小文字にして比較する。 |
| 5   | パスワードハッシュ | `password_hash` | varchar(255) | ○   |            |       | NFR-S-02                                                     |
| 6   | 部署               | `department`    | varchar(50)  | ○   |            |       | 例：`開発部`                                                 |
| 7   | ロール             | `role`          | varchar(20)  | ○   | `'member'` | CHECK | `member`：一般社員、`admin`：管理者                          |
| 8   | 作成日時           | `created_at`    | timestamptz  | ○   | `now()`    |       |                                                              |
| 9   | 更新日時           | `updated_at`    | timestamptz  | ○   | `now()`    |       |                                                              |

| 種類  | 名前                     | 内容                          |
| ----- | ------------------------ | ----------------------------- |
| CHECK | `chk_users_role`         | `role IN ('member', 'admin')` |
| UQ    | `uq_users_employee_code` | `(employee_code)`             |
| UQ    | `uq_users_email`         | `(email)`                     |

### 3.2 sessions（セッション）

| No  | 論理名           | 物理名       | 型          | NN  | デフォルト | 制約                                 | 備考                                                                                     |
| --- | ---------------- | ------------ | ----------- | --- | ---------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| 1   | トークンハッシュ | `token_hash` | varchar(64) | ○   |            | PK                                   | セッショントークンの SHA-256（16進数64文字）。トークンそのものは保存しない（NFR-S-03）。 |
| 2   | 社員ID           | `user_id`    | integer     | ○   |            | FK → `users.id`（ON DELETE CASCADE） |                                                                                          |
| 3   | 有効期限         | `expires_at` | timestamptz | ○   |            |                                      | ログイン日時＋8時間（NFR-S-04）                                                          |
| 4   | 作成日時         | `created_at` | timestamptz | ○   | `now()`    |                                      |                                                                                          |

| 種類  | 名前                   | 内容        |
| ----- | ---------------------- | ----------- |
| INDEX | `idx_sessions_user_id` | `(user_id)` |

- `expires_at` を過ぎたセッションは、認証のときに無効として扱う。期限切れの行を定期的に削除する処理は第2期で検討する。
- ログアウトしたら、そのセッションの行を削除する。

### 3.3 categories（カテゴリ）

| No  | 論理名     | 物理名       | 型          | NN  | デフォルト | 制約 | 備考               |
| --- | ---------- | ------------ | ----------- | --- | ---------- | ---- | ------------------ |
| 1   | ID         | `id`         | integer     | ○   | IDENTITY   | PK   |                    |
| 2   | カテゴリ名 | `name`       | varchar(30) | ○   |            | UQ   |                    |
| 3   | 表示順     | `sort_order` | integer     | ○   | `0`        |      | 小さい順に表示する |
| 4   | 作成日時   | `created_at` | timestamptz | ○   | `now()`    |      |                    |
| 5   | 更新日時   | `updated_at` | timestamptz | ○   | `now()`    |      |                    |

| 種類 | 名前                 | 内容     |
| ---- | -------------------- | -------- |
| UQ   | `uq_categories_name` | `(name)` |

### 3.4 equipment（備品）

| No  | 論理名     | 物理名             | 型            | NN  | デフォルト | 制約                                       | 備考                                                        |
| --- | ---------- | ------------------ | ------------- | --- | ---------- | ------------------------------------------ | ----------------------------------------------------------- |
| 1   | ID         | `id`               | integer       | ○   | IDENTITY   | PK                                         |                                                             |
| 2   | 管理番号   | `asset_code`       | varchar(20)   | ○   |            | UQ                                         | 形式 `^[A-Z]{2,4}-[0-9]{4}$`。登録後は変更しない（BR-13）。 |
| 3   | 備品名     | `name`             | varchar(100)  | ○   |            |                                            |                                                             |
| 4   | カテゴリID | `category_id`      | integer       | ○   |            | FK → `categories.id`（ON DELETE RESTRICT） |                                                             |
| 5   | 保有数     | `quantity`         | integer       | ○   |            | CHECK                                      | 1〜99                                                       |
| 6   | 保管場所   | `storage_location` | varchar(100)  | ○   |            |                                            |                                                             |
| 7   | 説明       | `description`      | varchar(1000) |     |            |                                            | 未設定は NULL                                               |
| 8   | 状態       | `status`           | varchar(20)   | ○   | `'active'` | CHECK                                      | `active`：通常、`suspended`：貸出停止                       |
| 9   | バージョン | `version`          | integer       | ○   | `1`        |                                            | 更新のたびに1増やす（楽観ロック。FR-13）                    |
| 10  | 削除日時   | `deleted_at`       | timestamptz   |     |            |                                            | NULL なら未削除（論理削除。FR-14）                          |
| 11  | 作成日時   | `created_at`       | timestamptz   | ○   | `now()`    |                                            |                                                             |
| 12  | 更新日時   | `updated_at`       | timestamptz   | ○   | `now()`    |                                            |                                                             |

| 種類  | 名前                        | 内容                                                |
| ----- | --------------------------- | --------------------------------------------------- |
| UQ    | `uq_equipment_asset_code`   | `(asset_code)`。削除済みの行も含めて一意（BR-13）。 |
| CHECK | `chk_equipment_quantity`    | `quantity BETWEEN 1 AND 99`                         |
| CHECK | `chk_equipment_status`      | `status IN ('active', 'suspended')`                 |
| INDEX | `idx_equipment_category_id` | `(category_id)`                                     |

### 3.5 loans（貸出申請）

| No  | 論理名         | 物理名          | 型           | NN  | デフォルト  | 制約                                      | 備考                                                        |
| --- | -------------- | --------------- | ------------ | --- | ----------- | ----------------------------------------- | ----------------------------------------------------------- |
| 1   | ID             | `id`            | integer      | ○   | IDENTITY    | PK                                        | 画面では「申請番号」として表示する                          |
| 2   | 備品ID         | `equipment_id`  | integer      | ○   |             | FK → `equipment.id`（ON DELETE RESTRICT） |                                                             |
| 3   | 申請者ID       | `borrower_id`   | integer      | ○   |             | FK → `users.id`（ON DELETE RESTRICT）     |                                                             |
| 4   | ステータス     | `status`        | varchar(20)  | ○   | `'pending'` | CHECK                                     | 値は [01 要件定義書 6.3](01_requirements.md#ステータス一覧) |
| 5   | 利用目的       | `purpose`       | varchar(200) | ○   |             |                                           |                                                             |
| 6   | 返却予定日     | `due_date`      | date         | ○   |             |                                           | BR-05                                                       |
| 7   | 承認・却下者ID | `reviewed_by`   | integer      |     |             | FK → `users.id`（ON DELETE RESTRICT）     | 承認または却下した管理者                                    |
| 8   | 承認・却下日時 | `reviewed_at`   | timestamptz  |     |             |                                           |                                                             |
| 9   | 却下理由       | `reject_reason` | varchar(200) |     |             | CHECK                                     | BR-09                                                       |
| 10  | 貸出日時       | `lent_at`       | timestamptz  |     |             | CHECK                                     | 貸出を記録した日時                                          |
| 11  | 返却日時       | `returned_at`   | timestamptz  |     |             | CHECK                                     | 返却を記録した日時                                          |
| 12  | 取消者ID       | `cancelled_by`  | integer      |     |             | FK → `users.id`（ON DELETE RESTRICT）     | 本人または管理者（BR-16）                                   |
| 13  | 取消日時       | `cancelled_at`  | timestamptz  |     |             |                                           |                                                             |
| 14  | 作成日時       | `created_at`    | timestamptz  | ○   | `now()`     |                                           | 申請日時                                                    |
| 15  | 更新日時       | `updated_at`    | timestamptz  | ○   | `now()`     |                                           |                                                             |

| 種類       | 名前                                 | 内容                                                                                                                                              |
| ---------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| CHECK      | `chk_loans_status`                   | `status IN ('pending', 'approved', 'lent', 'returned', 'rejected', 'cancelled')`                                                                  |
| CHECK      | `chk_loans_reject_reason`            | `status <> 'rejected' OR reject_reason IS NOT NULL`                                                                                               |
| CHECK      | `chk_loans_lent_at`                  | `status NOT IN ('lent', 'returned') OR lent_at IS NOT NULL`                                                                                       |
| CHECK      | `chk_loans_returned_at`              | `status <> 'returned' OR returned_at IS NOT NULL`                                                                                                 |
| UQ（部分） | `uq_loans_active_equipment_borrower` | `(equipment_id, borrower_id) WHERE status IN ('pending', 'approved', 'lent')`。同じ社員が同じ備品の未完了の申請を2件持てないようにする（BR-04）。 |
| INDEX      | `idx_loans_equipment_id_status`      | `(equipment_id, status)`。引当数の計算（BR-01）に使う。                                                                                           |
| INDEX      | `idx_loans_borrower_id_created_at`   | `(borrower_id, created_at DESC)`。自分の申請一覧（SCR-06）に使う。                                                                                |
| INDEX      | `idx_loans_status_due_date`          | `(status, due_date)`。延滞の検索（BR-06）に使う。                                                                                                 |

- 貸出・返却を記録した管理者は、このテーブルには持たず、`audit_logs` で追跡する。
- 部分一意インデックス `uq_loans_active_equipment_borrower` は、BR-04 のチェックをアプリケーションで行ったうえでの最後の防御線とする。一意制約違反が起きたら `409 DUPLICATE_ACTIVE_LOAN` を返す。

### 3.6 audit_logs（操作履歴）

| No  | 論理名     | 物理名        | 型          | NN  | デフォルト | 制約                                  | 備考                                                                |
| --- | ---------- | ------------- | ----------- | --- | ---------- | ------------------------------------- | ------------------------------------------------------------------- |
| 1   | ID         | `id`          | integer     | ○   | IDENTITY   | PK                                    |                                                                     |
| 2   | 操作者ID   | `actor_id`    | integer     | ○   |            | FK → `users.id`（ON DELETE RESTRICT） |                                                                     |
| 3   | 操作種別   | `action`      | varchar(50) | ○   |            | CHECK                                 | 下表                                                                |
| 4   | 対象の種類 | `target_type` | varchar(20) | ○   |            | CHECK                                 | `equipment` または `loan`                                           |
| 5   | 対象のID   | `target_id`   | integer     | ○   |            |                                       | 外部キー制約は付けない（[04 ER図](04_er_diagram.md) 設計上の判断6） |
| 6   | 内容       | `detail`      | jsonb       | ○   | `'{}'`     |                                       | 下表                                                                |
| 7   | 操作日時   | `created_at`  | timestamptz | ○   | `now()`    |                                       |                                                                     |

| 種類  | 名前                         | 内容                                                                                                                                                               |
| ----- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CHECK | `chk_audit_logs_action`      | `action IN ('equipment.create', 'equipment.update', 'equipment.delete', 'loan.request', 'loan.approve', 'loan.reject', 'loan.cancel', 'loan.lend', 'loan.return')` |
| CHECK | `chk_audit_logs_target_type` | `target_type IN ('equipment', 'loan')`                                                                                                                             |
| INDEX | `idx_audit_logs_created_at`  | `(created_at DESC)`                                                                                                                                                |
| INDEX | `idx_audit_logs_target`      | `(target_type, target_id)`                                                                                                                                         |
| INDEX | `idx_audit_logs_actor_id`    | `(actor_id)`                                                                                                                                                       |

- 操作履歴は追記だけを行い、UPDATE・DELETE しない（NFR-M-02）。`updated_at` は持たない。
- 業務操作と同じトランザクションで INSERT する（BR-14）。

#### 操作種別と `detail` の形式

| `action`                                                                  | `target_type` | `detail` の形式                                                                                                                                                      |
| ------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `equipment.create`                                                        | `equipment`   | `{"assetCode": "PC-0041", "name": "ノートPC（14インチ）"}`                                                                                                           |
| `equipment.update`                                                        | `equipment`   | `{"assetCode": "PC-0003", "name": "ノートPC（14インチ）", "changes": {"status": {"before": "active", "after": "suspended"}, "quantity": {"before": 1, "after": 2}}}` |
| `equipment.delete`                                                        | `equipment`   | `{"assetCode": "PC-0003", "name": "ノートPC（14インチ）"}`                                                                                                           |
| `loan.request`・`loan.approve`・`loan.cancel`・`loan.lend`・`loan.return` | `loan`        | `{"equipmentAssetCode": "PC-0003", "equipmentName": "ノートPC（14インチ）", "borrowerName": "山田 太郎"}`                                                            |
| `loan.reject`                                                             | `loan`        | `{"equipmentAssetCode": "PC-0003", "equipmentName": "ノートPC（14インチ）", "borrowerName": "山田 太郎", "reason": "修理予定のため"}`                                |

- `equipment.update` の `name` には**変更後**の備品名を入れる。
- `changes` には、実際に値が変わった項目だけを入れる。キーは `name`・`category`・`quantity`・`storageLocation`・`description`・`status`。`category` の値はカテゴリ ID ではなくカテゴリ名にする。

---

## 4. 初期データ（シード）

シードスクリプトは何度実行しても同じ結果になるように作る（NFR-T-02）。

### 4.1 categories

| id  | name     | sort_order | 管理番号の接頭辞（運用上の目安） |
| --- | -------- | ---------- | -------------------------------- |
| 1   | PC       | 10         | `PC`                             |
| 2   | モニター | 20         | `MN`                             |
| 3   | 周辺機器 | 30         | `AC`                             |
| 4   | 書籍     | 40         | `BK`                             |
| 5   | 通信機器 | 50         | `NW`                             |
| 6   | その他   | 60         | `OT`                             |

### 4.2 users

| 区分     | 件数 | 内容                     |
| -------- | ---- | ------------------------ |
| 管理者   | 2    | 総務部の社員             |
| 一般社員 | 8    | 開発部・営業部などの社員 |

- メールアドレスのドメインは `example.com` を使う（例：`admin1@example.com`、`member1@example.com`）。
- パスワードは全員共通の開発用パスワードにし、リポジトリの README に記載する。本番環境でも同じシードを使うため、実在の人物のメールアドレスやパスワードは使わない。

### 4.3 equipment・loans

| 対象      | 件数     | 含める状態                                                                  |
| --------- | -------- | --------------------------------------------------------------------------- |
| equipment | 30件前後 | 全カテゴリ。保有数が複数の書籍、貸出停止中、在庫なしの備品を含める。        |
| loans     | 20件前後 | すべてのステータスを1件以上。延滞している貸出、返却期限間近の貸出を含める。 |

延滞・返却期限間近のデータは、シードを実行した日を基準に返却予定日を計算して作る。
