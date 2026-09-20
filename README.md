# 備品貸出管理システム

株式会社ノースブリッジ（架空の会社）の総務部向けに、備品の貸出申請から返却までを管理する Web システムです。

- 仕様書：[docs/](docs/README.md)
- 技術スタック：Next.js（App Router）／TypeScript／PostgreSQL 17／Docker Compose（開発用 DB）／Vercel・Neon（本番）

---

## 目次

1. [全体像](#1-全体像)
2. [環境構築（Windows）](#2-環境構築windows)
3. [環境構築（Mac）](#3-環境構築mac)
4. [アプリを起動する（Windows・Mac 共通）](#4-アプリを起動するwindowsmac-共通)
5. [毎日の作業](#5-毎日の作業)
6. [npm スクリプト一覧](#6-npm-スクリプト一覧)
7. [困ったとき](#7-困ったとき)

---

## 1. 全体像

```
あなたのPC
├─ Docker（コンテナ）
│    └─ PostgreSQL 17 ……… compose.yaml で起動。ポート 5433
└─ Node.js 24
     └─ Next.js（npm run dev）…… http://localhost:3000
```

- **Docker で動かすのはデータベース（PostgreSQL）だけ**です。Next.js はコンテナに入れず、PC 上で直接動かします。
- Windows では、**WSL2（Windows の中で動く Linux）の Ubuntu** を使って開発します。リーダーの Mac と同じコマンドで作業できるようにするためです。

---

## 2. 環境構築（Windows）

所要時間の目安：1〜2時間（ダウンロード時間を含む）

### 2-0. 事前確認

| 確認すること                       | 確認方法                                              | 必要な条件                                       |
| ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| Windows のエディションとバージョン | `Win` + `R` → `winver` と入力して Enter               | Windows 11 は 23H2 以上、Windows 10 は 22H2 以上 |
| メモリ                             | 設定 → システム → バージョン情報 →「実装 RAM」        | 8GB 以上                                         |
| 仮想化                             | タスクマネージャー → パフォーマンス → CPU →「仮想化」 | 「有効」                                         |

- Docker Desktop の公式の要件には、エディションとして Pro・Enterprise・Education が挙がっています。**Windows Home の場合は、先に進む前にリーダーに伝えてください。**
- 仮想化が「無効」の場合は、BIOS/UEFI の設定変更が必要です（PC のメーカーごとに手順が違います）。自分で変更せず、リーダーに相談してください。

### 2-1. WSL2 と Ubuntu を入れる

1. スタートメニューで「PowerShell」を検索し、右クリック →「管理者として実行」。
2. 次のコマンドを実行します。

   ```powershell
   wsl --install
   ```

3. 完了したら **PC を再起動**します。
4. 再起動後、Ubuntu のウィンドウが開きます（開かなければスタートメニューで「Ubuntu」を起動）。
5. Linux のユーザー名とパスワードを決めて入力します。
   - Windows のアカウントとは別物です。英小文字のユーザー名にしてください。
   - **パスワードは `sudo` コマンドで毎回使うので、忘れないように控えておいてください。**（入力中は画面に何も表示されませんが、入力はされています）
6. PowerShell（管理者でなくてよい）で、次の2つを確認します。

   ```powershell
   wsl -l -v
   ```

   `Ubuntu` の `VERSION` が `2` であれば OK です。

   ```powershell
   wsl --version
   ```

   `WSL バージョン` が `2.1.5` 以上であれば OK です。古い場合は `wsl --update` を実行してください。

> `wsl --install` を実行してヘルプが表示された場合は、WSL が既に入っています。`wsl --install -d Ubuntu` を実行してください。

### 2-2. Docker Desktop を入れる

1. [Docker Desktop のインストールページ](https://docs.docker.com/desktop/setup/install/windows-install/) から「Docker Desktop for Windows - x86_64」をダウンロードします。
2. `Docker Desktop Installer.exe` を実行します。設定画面では **「Use WSL 2 instead of Hyper-V」にチェックを入れたまま**進めます。
3. インストールが終わったら Docker Desktop を起動します（利用規約への同意を求められます。個人の学習目的の利用は無料の範囲です）。
4. Docker Desktop の **Settings（歯車アイコン）** を開き、次の2つを設定します。
   - **General** →「**Use WSL 2 based engine**」にチェック
   - **Resources** → **WSL Integration** →「**Ubuntu**」をオン
   - 右下の「**Apply & restart**」を押す
5. **Ubuntu のターミナル**で、次のコマンドが動くことを確認します。

   ```bash
   docker version
   docker compose version
   docker run --rm hello-world
   ```

   最後のコマンドで `Hello from Docker!` と表示されれば OK です。

### 2-3. エディタとターミナルを用意する

1. [Visual Studio Code](https://code.visualstudio.com/) を Windows に入れます。
2. VS Code の拡張機能で **「WSL」**（Microsoft 製）を入れます。
3. ターミナルは **Windows Terminal** を使うと便利です（Windows 11 には最初から入っています）。タブの「∨」から「Ubuntu」を選ぶと、Ubuntu のターミナルが開きます。

**ここから先のコマンドは、すべて Ubuntu のターミナルで実行します。**（PowerShell ではありません）

### 2-4. Ubuntu の準備

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl git
```

### 2-5. Git と GitHub の設定

Windows 側で Git を設定済みでも、**Ubuntu の中では別に設定が必要**です。

1. 名前とメールアドレスを設定します（GitHub に登録しているものと同じにする）。

   ```bash
   git config --global user.name "あなたの名前"
   git config --global user.email "あなたのメールアドレス"
   git config --global init.defaultBranch main
   ```

2. GitHub に接続するための SSH キーを作ります。質問はすべて Enter で進めて構いません。

   ```bash
   ssh-keygen -t ed25519 -C "あなたのメールアドレス"
   cat ~/.ssh/id_ed25519.pub
   ```

3. 表示された `ssh-ed25519` から始まる1行をコピーし、GitHub の **Settings → SSH and GPG keys → New SSH key** に貼り付けて保存します。
4. 接続を確認します。初回は `yes` と入力します。

   ```bash
   ssh -T git@github.com
   ```

   `Hi あなたのユーザー名! You've successfully authenticated` と表示されれば OK です。

### 2-6. リポジトリをクローンする

**必ず Ubuntu のホームディレクトリ（`~`）の下にクローンしてください。** Windows 側のフォルダ（`/mnt/c/...`）に置くと、ファイルの読み書きが遅くなり、画面の自動更新が効かないことがあります。

<!-- TODO(leader): <OWNER>/<REPO> を実際のリポジトリに置き換える -->

```bash
mkdir -p ~/dev
cd ~/dev
git clone git@github.com:<OWNER>/<REPO>.git
cd <REPO>
pwd
```

`pwd` の結果が `/home/ユーザー名/dev/...` であれば OK です。

VS Code で開くときは、このディレクトリで次を実行します（左下に「WSL: Ubuntu」と表示されていれば正しく開けています）。

```bash
code .
```

### 2-7. Node.js を入れる

Node.js のバージョン管理ツール **nvm** を使い、リポジトリの `.nvmrc` に書かれたバージョン（24）を入れます。

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.7/install.sh | bash
```

**ターミナルを一度閉じて開き直してから**、リポジトリのディレクトリで実行します。

```bash
cd ~/dev/<REPO>
nvm install
node -v
```

`v24.` から始まるバージョンが表示されれば OK です。

→ 続きは [4. アプリを起動する](#4-アプリを起動するwindowsmac-共通) へ。

---

## 3. 環境構築（Mac）

1. [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) を入れて起動します（Apple シリコンか Intel かで、ダウンロードするファイルが違います）。
2. `docker run --rm hello-world` で `Hello from Docker!` と表示されることを確認します。
3. Git と GitHub の SSH 接続を設定します（2-5 と同じ）。
4. リポジトリをクローンします（場所は任意）。
5. Node.js 24 を入れます。nvm を使う場合は 2-7 と同じコマンドです。Volta などほかのツールを使っている場合は、`.nvmrc` のバージョン（24）に合わせてください。

→ 続きは [4. アプリを起動する](#4-アプリを起動するwindowsmac-共通) へ。

---

## 4. アプリを起動する（Windows・Mac 共通）

リポジトリのディレクトリで、上から順に実行します。

### 4-1. 環境変数ファイルを作る

```bash
cp .env.example .env
```

### 4-2. データベースを起動する

```bash
docker compose up -d
docker compose ps
```

`STATUS` が `Up ... (healthy)` になれば OK です（起動直後は `(health: starting)` と表示されます。数秒待ってからもう一度 `docker compose ps` を実行してください）。

### 4-3. パッケージを入れる

```bash
npm ci
```

### 4-4. テーブルを作り、初期データを入れる

```bash
npm run db:migrate
npm run db:seed
```

### 4-5. 開発サーバーを起動する

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます（Windows の場合も、Windows 側のブラウザでそのまま開けます）。

### 4-6. ログインする

初期データには、次のアカウントが入っています。

| ロール   | メールアドレス        | パスワード    |
| -------- | --------------------- | ------------- |
| 管理者   | `admin1@example.com`  | `password123` |
| 一般社員 | `member1@example.com` | `password123` |

管理者は `admin1` `admin2`、一般社員は `member1`〜`member8` の8名が入っています。パスワードは全員同じです（開発用。環境変数 `SEED_PASSWORD` で変えられます）。

### 4-7. チェックが通ることを確認する

別のターミナルを開き、リポジトリのディレクトリで実行します。CI（GitHub Actions）でも同じチェックが動きます。

```bash
npm run lint
npm run typecheck
npm test
```

ここまでエラーなく進めば、環境構築は完了です。

---

## 5. 毎日の作業

### 始めるとき

1. Docker Desktop を起動する
2. リポジトリのディレクトリで次を実行する

   ```bash
   docker compose up -d
   npm run dev
   ```

### 終わるとき

1. `npm run dev` を動かしているターミナルで `Ctrl` + `C`
2. データベースを止める（データは消えません）

   ```bash
   docker compose stop
   ```

### データベースに SQL で直接つなぐ

```bash
docker compose exec db psql -U app -d equipment_lending
```

`\dt` でテーブル一覧、`\q` で終了します。

### データベースを作り直す

データがおかしくなったときは、次の手順で空の状態から作り直せます。**データベースの中身はすべて消えます。**

```bash
docker compose down -v
docker compose up -d
npm run db:migrate
npm run db:seed
```

### main の最新を取り込んだあと

ほかの人の変更でパッケージやテーブルが変わっていることがあります。

```bash
npm ci
npm run db:migrate
```

---

## 6. npm スクリプト一覧

| コマンド               | 内容                                                                |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | 開発サーバーを起動する                                              |
| `npm run build`        | 本番用にビルドする                                                  |
| `npm run start`        | ビルドしたものを起動する                                            |
| `npm run lint`         | ESLint でチェックする（`npm run lint:fix` で自動修正）              |
| `npm run format`       | Prettier で整形する（`npm run format:check` で確認だけ）            |
| `npm run typecheck`    | TypeScript の型チェックをする                                       |
| `npm test`             | テストを実行する（`npm run test:watch` で変更を監視）               |
| `npm run db:migrate`   | マイグレーションを実行してテーブルを最新にする                      |
| `npm run db:seed`      | 初期データを入れる（何度実行しても同じ結果になる）                  |
| `npm run db:reset`     | DB を作り直してマイグレーションとシードを実行する（データは消える） |
| `npm run db:studio`    | Prisma Studio でテーブルの中身をブラウザから見る                    |
| `npm run db:perf`      | 性能検証用データを入れる（`-- --clean` で削除）                     |
| `npm run perf:measure` | 主要クエリの応答時間を測る（NFR-P-01 の確認）                       |

### コミット前・push 前の自動チェック

Git のフック（husky）で、次のチェックが自動で走ります。**手元で落ちたものは CI でも落ちます。**

| タイミング   | 実行されるもの                                                        |
| ------------ | --------------------------------------------------------------------- |
| `git commit` | ステージした変更に ESLint の自動修正と Prettier の整形（lint-staged） |
| `git push`   | `npm run typecheck` と `npm test`                                     |

フックは `npm ci`（または `npm install`）を実行したときに自動で設定されます（`prepare` スクリプト）。

---

## 7. 困ったとき

| 症状                                                                           | 原因と対処                                                                                                                                                                                     |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ubuntu で `docker: command not found`                                          | Docker Desktop の Settings → Resources → WSL Integration で「Ubuntu」がオンになっているか確認し、「Apply & restart」を押す。                                                                   |
| `Cannot connect to the Docker daemon`                                          | Docker Desktop が起動していない。起動してから、もう一度実行する。                                                                                                                              |
| `docker compose up` で `port is already allocated` や `address already in use` | 5433 番ポートを別のプログラムが使っている。`compose.yaml` の `"5433:5432"` の左側と、`.env` の `DATABASE_URL` の `5433` を、同じ別の番号（例：`5434`）に変える。**この変更はコミットしない。** |
| 画面を保存しても自動で更新されない・動作がとても遅い                           | リポジトリが Windows 側のフォルダ（`/mnt/c/...`）にある。`pwd` で確認し、2-6 の手順で `~/dev` にクローンし直す。                                                                               |
| `nvm: command not found`                                                       | nvm を入れたあと、ターミナルを開き直していない。                                                                                                                                               |
| `npm ci` が失敗する、`node -v` が 24 でない                                    | リポジトリのディレクトリで `nvm install` を実行する。                                                                                                                                          |
| ログインできない                                                               | `npm run db:seed` を実行していない。4-4 を実行する。                                                                                                                                           |
| Git ですべてのファイルが「変更あり」になる                                     | Windows 側の Git や別のエディタで、同じフォルダを開いた可能性がある。Ubuntu の中でクローンしたフォルダだけを使う。                                                                             |

解決しないときは、Issue に次の3つを貼って相談してください。

1. 実行したコマンド
2. 表示されたエラーメッセージの**全文**（スクリーンショットではなくテキストで）
3. OS（Windows／Mac）とそのバージョン
