# ISSUE-02 ログイン・ログアウト

| 項目     | 内容                                  |
| -------- | ------------------------------------- |
| 見積もり | 8h                                    |
| 前提     | ISSUE-01                              |
| 優先度   | Must                                  |
| ラベル   | `type:feature`, `area:api`, `area:ui` |

## 概要

社員がメールアドレスとパスワードでログインし、ログアウトできるようにする。以降のすべての機能が、このセッションの仕組みの上に乗る。

## 対象の仕様

- 機能要件：FR-01、FR-02
- 業務ルール：BR-17
- 非機能要件：NFR-S-01〜S-05、NFR-S-11、NFR-M-03
- 画面：[SCR-01 ログイン](../screens/SCR-01_login.md)
- API：`POST /api/auth/login`、`POST /api/auth/logout`、`GET /api/auth/me`（[API設計書](../06_api_design.md)、[OpenAPI](../api/openapi.yaml)）

## やること

- [ ] パスワードの照合（シードは bcrypt で保存されている）
- [ ] セッションの発行：32バイト以上の乱数をトークンにし、SHA-256 のハッシュを `sessions` に保存する
- [ ] Cookie `session_token` を `HttpOnly` / `SameSite=Lax` / `Path=/`、本番のみ `Secure` で設定する。有効期限はログインから8時間
- [ ] `POST /api/auth/login`・`POST /api/auth/logout`・`GET /api/auth/me` を実装する
- [ ] 更新系 API の `Origin` 検証（NFR-S-11）を共通化して入れる
- [ ] SCR-01 の画面を作る（入力チェック、失敗時の表示、`?reason=expired` の表示）
- [ ] 単体テスト：セッションの有効期限切れの判定、パスワードの照合

## 受入条件

- [ ] 正しいメールアドレスとパスワードでログインでき、ホームへ移動する
- [ ] 誤った組み合わせでは「メールアドレスまたはパスワードが正しくありません」と表示され、**どちらが誤りかは区別されない**（BR-17）
- [ ] ログアウトすると Cookie が消え、`sessions` の行も削除される
- [ ] ブラウザの開発者ツールで Cookie に `HttpOnly` と `SameSite=Lax` が付いている
- [ ] `sessions` テーブルにトークンそのものが保存されていない（psql で確認した結果を PR に貼る）
- [ ] サーバーのログにパスワード・トークンが出ていない（NFR-M-03）

## 実装の手がかり

- 乱数は `crypto.randomBytes(32).toString("base64url")`、ハッシュは `crypto.createHash("sha256")` で作れる。
- Cookie の読み書きは Next.js の `cookies()` を使う。
- セッションの検証は毎回使うので、`src/server/auth/` のような場所に関数としてまとめておくと、次の Issue から使い回せる。

## この Issue でやらないこと

- 共通ヘッダー、未ログイン時のリダイレクト、403・404 画面（ISSUE-03）
- パスワードリセット、アカウントロック（対象外。NFR-S-13）
