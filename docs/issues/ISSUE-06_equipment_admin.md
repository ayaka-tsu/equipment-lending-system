# ISSUE-06 備品の登録・編集・削除（管理者）

| 項目     | 内容                                             |
| -------- | ------------------------------------------------ |
| 見積もり | 9h                                               |
| 前提     | ISSUE-05                                         |
| 優先度   | Must                                             |
| ラベル   | `type:feature`, `area:api`, `area:ui`, `area:db` |

## 概要

総務部が備品を自分で登録・修正・削除できるようにする。あわせて、誰がいつ備品を変更したかを操作履歴に残す。

## 対象の仕様

- 機能要件：FR-12、FR-13、FR-14、FR-32
- 業務ルール：BR-11、BR-12、BR-13、BR-14
- 非機能要件：NFR-S-06、NFR-S-08
- 画面：[SCR-10 備品登録](../screens/SCR-10_equipment_new.md)、[SCR-11 備品編集](../screens/SCR-11_equipment_edit.md)
- API：`POST /api/equipment`、`PATCH /api/equipment/{equipmentId}`、`DELETE /api/equipment/{equipmentId}`
- 操作履歴の形式：[05 テーブル定義書 3.6](../05_table_definitions.md)

## やること

- [ ] `POST /api/equipment`（管理者のみ）を実装する。管理番号の重複は 409 `ASSET_CODE_ALREADY_EXISTS`
- [ ] `PATCH /api/equipment/{equipmentId}` を実装する。`version` が違えば 409 `EDIT_CONFLICT`（楽観ロック）
- [ ] 保有数を引当数より小さくしようとしたら 409 `QUANTITY_BELOW_ACTIVE_LOANS`（BR-12）
- [ ] `DELETE /api/equipment/{equipmentId}` を実装する（論理削除）。未完了の申請があれば 409 `EQUIPMENT_HAS_ACTIVE_LOANS`（BR-11）
- [ ] SCR-10・SCR-11 の画面を作る（入力チェック、エラーの表示、削除の確認ダイアログ）
- [ ] 一覧（SCR-03）と詳細（SCR-04）に、管理者向けの「＋ 備品を登録」「編集」ボタンを追加する
- [ ] 登録・編集・削除を `audit_logs` に記録する。編集は変更前後の値を `changes` に入れる（BR-14）
- [ ] 単体テスト：楽観ロックの判定、保有数の下限チェック

## 受入条件

- [ ] 一般社員のアカウントでこれらの API を直接呼ぶと 403 が返る
- [ ] 管理番号を既存のものにすると、管理番号の欄にエラーが表示される
- [ ] 2つのタブで同じ備品の編集画面を開き、片方を保存したあとにもう片方を保存すると `EDIT_CONFLICT` のメッセージが出る（この手順を PR に書く）
- [ ] 貸出中の備品を削除しようとするとエラーになり、削除されない
- [ ] 削除した備品は一覧・詳細から消えるが、過去の申請の表示は壊れない
- [ ] 操作履歴に3種類（登録・編集・削除）が記録され、編集では変更した項目だけが `changes` に入っている
- [ ] 業務操作と操作履歴が**同じトランザクション**で保存されている（BR-14）

## 実装の手がかり

- 楽観ロックは `UPDATE ... WHERE id = ? AND version = ?` の形にして、更新件数が0なら 409 を返す。`updated_at` で比較しないこと（精度の違いで誤判定する）。
- 引当数を数えてから更新するまでの間に申請が増えないよう、備品の行をロックしてから数える。
- 操作履歴の記録は毎回書くことになるので、`recordAuditLog(tx, ...)` のような関数にまとめると次の Issue から使える。

## この Issue でやらないこと

- 操作履歴の閲覧画面（ISSUE-13）
- カテゴリの管理画面（対象外）
