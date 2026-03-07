# タスク一覧

## このファイルの位置づけ
- このファイルを、現時点のタスク管理の正本とする。
- `進行中` は常に 1 件までにする。
- `完了` に移すときは、テスト結果やコミット識別子などの証拠を残す。

## 標準実行環境
- 採用標準は `Node.js v24.14.0`、`npm 11.9.0` とする。
- `T-001` の証拠にある `Node.js v20.19.0`、`npm 11.3.0` は、基盤作成時に実際に動作確認した環境であり、採用標準ではない。

## 進行中
- なし

## 次

### T-002 Backend の最小起動と request logging を入れる
- 目的: Fastify の最小 API 起動と request 単位のログ出力を整え、失敗時の追跡起点をファイルにも残る形で作る。
- 範囲: logger 設定、起動設定、request ごとの基本ログ、`logs/backend/app.log` へのローカルファイル永続化、想定外エラー時の出力方針
- 範囲外: Todo API の実装、Database 永続化、外部監視サービス
- 失敗検知: API が 500 を返した時に、request 単位で追えるログが `stdout / stderr` とローカルファイルの両方に残る状態にする。
- 被害限定: logging の責務を Backend に閉じ、Frontend や Database の未実装へ影響を広げない。
- 完了条件:
  - Backend 起動時に logger が有効になっている
  - request ごとに基本情報がログへ残る
  - ログがローカルファイルへ永続化される
  - 想定外エラー時に stack trace をローカルファイルで確認できる
  - ログファイルの保存先が `logs/backend/app.log` に決まっている
  - 最小の logging テストまたは確認手順が残っている
- 想定テスト:
  - health check の応答確認
  - request 実行後にログファイルへ記録されることの確認
  - 想定外エラー時にログファイルへ stack trace が残ることの確認
- 証拠: 未着手

## 候補
- T-003 SQLite と Drizzle ORM で Todo テーブルを作る
- T-004 `POST /todos` を schema 付きで実装する
- T-005 `GET /todos` を schema 付きで実装する
- T-006 Frontend で Todo 一覧を表示する
- T-007 Frontend で Todo を追加し、保存失敗を表示する
- T-008 Todo の完了切り替えを実装する
- T-009 Todo 削除に確認ダイアログを入れる
- T-010 Playwright で重要な流れを End-to-End で確認する

## 保留
- なし

## 完了

### T-001 開発基盤を作る
- 目的: `apps/frontend` と `apps/backend` を持つ最小構成を作り、開発の土台を整える。
- 範囲: `npm workspaces`、TypeScript 設定、Vite の初期化、Fastify の初期化、Vitest の初期設定
- 範囲外: Todo 機能そのものの実装、Database 永続化、End-to-End テスト
- 失敗検知: Frontend と Backend の起動失敗、テスト実行失敗、設定不整合がすぐ分かる状態にする。
- 被害限定: Frontend と Backend を最初から分け、後続の不具合が一箇所に閉じるようにする。
- 完了条件:
  - `apps/frontend` と `apps/backend` が作成されている
  - workspace 単位で install と test が実行できる
  - Frontend と Backend に最小のサンプルテストがある
  - 後続タスクのための基本コマンドが README か task 記録に残っている
- 想定テスト:
  - Frontend の最小単体テスト
  - Backend の最小単体テスト
  - workspace 全体の test 実行
- 証拠:
  - `npm install` 実行済み
  - `npm test` 実行済み
  - `npm run build --workspace @todo-ai-sandbox/frontend` 実行済み
  - `npm run build --workspace @todo-ai-sandbox/backend` 実行済み
  - 確認環境: `Node.js v20.19.0`, `npm 11.3.0`
  - 注記: この確認環境は採用標準ではない。採用標準は `Node.js v24.14.0`, `npm 11.9.0`

### T-011 開発環境を `Node.js v24.14.0` と `npm 11.9.0` に揃える
- 目的: 採用標準の実行環境に揃え、以後のテスト結果と不具合再現条件をぶらさないようにする。
- 範囲: Node.js と npm の版合わせ、リポジトリ内の版指定、標準環境での install と test の再確認
- 範囲外: Todo 機能の実装、Backend logging、Database 永続化
- 失敗検知: 採用標準の環境で install、test、build が失敗する場合に、その時点で差分を検知できるようにする。
- 被害限定: 実行環境のズレによる不具合を、機能実装へ持ち込む前に閉じ込める。
- 完了条件:
  - 手元の実行環境が `Node.js v24.14.0`、`npm 11.9.0` に揃っている
  - リポジトリ内に標準環境を示す設定が残っている
  - 標準環境で `npm install`、`npm test`、必要な build が通る
  - `docs/tasks.md` の証拠が標準環境ベースに更新されている
- 想定テスト:
  - `npm install`
  - `npm test`
  - `npm run build --workspace @todo-ai-sandbox/frontend`
  - `npm run build --workspace @todo-ai-sandbox/backend`
- 証拠:
  - `nvm install 24.14.0` 実行済み
  - `nvm alias default 24.14.0` 実行済み
  - `zsh -lic 'node -v'` で `v24.14.0` を確認済み
  - `zsh -lic 'npm -v'` で `11.9.0` を確認済み
  - `.nvmrc` を追加済み
  - `package.json` に `packageManager: npm@11.9.0` を追加済み
  - `package.json` の `engines` を `Node.js 24.14.0` / `npm 11.9.0` に更新済み
  - 標準環境で `npm install` 実行済み
  - 標準環境で `npm test` 実行済み
  - 標準環境で `npm run build --workspace @todo-ai-sandbox/frontend` 実行済み
  - 標準環境で `npm run build --workspace @todo-ai-sandbox/backend` 実行済み
