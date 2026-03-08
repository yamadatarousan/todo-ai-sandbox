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
- T-009 Todo 削除に確認ダイアログを入れる

## 候補
- T-010 Playwright で重要な流れを End-to-End で確認する

## 保留
- なし

## 完了

### T-008 Todo の完了切り替えを実装する
- 目的: Todo の完了状態を切り替えられるようにし、更新成功と更新失敗を 1 件単位で区別できるようにする。
- 範囲: `PATCH /todos/:id`、完了更新 use-case、repository 更新、Frontend の完了切り替え UI、更新中表示、更新失敗表示
- 範囲外: 削除、複数件一括更新
- 失敗検知: 完了更新の `404` / `500` を画面上で確認でき、Backend log でも追える状態にする。
- 被害限定: 1 件の更新失敗をその Todo 行に閉じ込め、一覧全体や追加フォームを壊さない。
- 完了条件:
  - Backend に `PATCH /todos/:id` が schema 付きで定義されている
  - Frontend から完了切り替えを実行できる
  - 更新中表示がある
  - `404` と `500` の失敗表示がある
  - 更新成功後に該当 Todo の表示だけが更新される
- 想定テスト:
  - 正常な完了切り替え確認
  - 存在しない Todo の `404` 確認
  - 更新失敗時の `500` 確認
- 証拠:
  - `apps/backend/src/routes/registerTodoRoutes.ts` に `PATCH /todos/:id` route と schema を追加済み
  - `apps/backend/src/use-cases/updateTodoCompletionUseCase.ts` に完了更新 use-case を追加済み
  - `apps/backend/src/repositories/createSqliteTodoRepository.ts` に完了更新処理を追加済み
  - `apps/backend/src/shared/requestError.ts` に `404` response 生成と `ResourceNotFoundError` を追加済み
  - `apps/backend/src/app/createApp.test.ts` に `PATCH /todos/:id` の 200 / 404 / 500 テストを追加済み
  - `apps/backend/src/use-cases/updateTodoCompletionUseCase.test.ts` に use-case テストを追加済み
  - `apps/backend/src/repositories/createSqliteTodoRepository.test.ts` に完了更新の repository 結合テストを追加済み
  - `apps/frontend/src/features/todos/updateTodoCompletion.ts` に `PATCH /todos/:id` client と失敗変換を追加済み
  - `apps/frontend/src/App.tsx` に Todo 行ごとの完了切り替え UI、更新中表示、更新失敗表示を追加済み
  - `apps/frontend/src/features/todos/updateTodoCompletion.test.ts` に client テストを追加済み
  - `apps/frontend/src/App.test.tsx` に完了切り替えの成功 / `404` / `500` 表示テストを追加済み
  - `README.md` に `PATCH /todos/:id` の利用例と Frontend の確認ポイントを追加済み
  - 標準環境で `npm run test --workspace @todo-ai-sandbox/backend` 実行済み
  - 標準環境で `npm run test --workspace @todo-ai-sandbox/frontend` 実行済み
  - 標準環境で `npm run build --workspace @todo-ai-sandbox/frontend` 実行済み
  - 標準環境で `npm run build --workspace @todo-ai-sandbox/backend` 実行済み
  - 標準環境で `npm test` 実行済み

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
- 証拠:
  - `apps/backend/src/app/createApp.test.ts` に request ログ永続化テストを追加済み
  - `apps/backend/src/app/createApp.test.ts` に想定外エラーの stack trace 記録テストを追加済み
  - `apps/backend/src/app/createLogger.ts` で `stdout`、`stderr`、`logs/backend/app.log` への multistream を実装済み
  - `apps/backend/src/server.ts` に起動時ログを追加済み
  - `README.md` に `logs/backend/app.log` の場所と確認コマンドを追加済み
  - 標準環境で `npm install` 実行済み
  - 標準環境で `npm test` 実行済み
  - 標準環境で `npm run build --workspace @todo-ai-sandbox/backend` 実行済み
  - 注記: `node --import tsx apps/backend/src/server.ts` による手動の `listen` 確認は sandbox の `EPERM` で未実施

### T-003 SQLite と Drizzle ORM で Todo テーブルを作る
- 目的: Todo の永続化基盤を作り、以後の API 実装で壊れ方を Database 側でも狭められるようにする。
- 範囲: SQLite 接続、Drizzle ORM 導入、Todo テーブル定義、migration の土台、基本制約
- 範囲外: Todo API の実装、Frontend 表示、外部 Database
- 失敗検知: 接続失敗、migration 不整合、制約違反が早い段階で分かる状態にする。
- 被害限定: 空文字や長すぎる title を Database 制約でも止め、Backend の不具合だけで壊れないようにする。
- 完了条件:
  - SQLite 接続が作成されている
  - Drizzle ORM の schema に Todo テーブルが定義されている
  - Todo テーブルの基本制約が入っている
  - migration の実行方法または確認方法が残っている
- 想定テスト:
  - schema 定義の確認
  - SQLite を使った最小の repository または migration 確認
- 証拠:
  - `apps/backend/src/database/createDatabaseConnection.ts` を追加済み
  - `apps/backend/src/database/schema.ts` に `todos` schema と制約を追加済み
  - `apps/backend/src/database/migrations/0001_create_todos.sql` を追加済み
  - `apps/backend/src/database/migrate.ts` に migration 実行基盤を追加済み
  - `apps/backend/src/database/migrate.test.ts` に migration と制約の結合テストを追加済み
  - `apps/backend/package.json` に `db:migrate` script と SQLite / Drizzle 依存関係を追加済み
  - `README.md` に migration コマンドと既定 DB パスを追加済み
  - 標準環境で `npm install` 実行済み
  - 標準環境で `npm run test --workspace @todo-ai-sandbox/backend` 実行済み
  - 標準環境で `npm run build --workspace @todo-ai-sandbox/backend` 実行済み
  - 標準環境で `TODO_AI_DATABASE_PATH=<temp>` を付けた `npm run db:migrate --workspace @todo-ai-sandbox/backend` 実行済み
  - 標準環境で `npm test` 実行済み

### T-004 `POST /todos` を schema 付きで実装する
- 目的: Todo 追加 API を最小で作り、入力不正と保存失敗を静かに通さない入口を作る。
- 範囲: route schema、use-case、repository の最小実装、成功時 response
- 範囲外: Todo 一覧取得、完了更新、Frontend の追加フォーム
- 失敗検知: バリデーション違反と保存失敗が response と log で追える状態にする。
- 被害限定: 不正な入力や Database 制約違反を 1 件の追加失敗に閉じ込める。
- 完了条件:
  - `POST /todos` が schema 付きで定義されている
  - 正常系で Todo を 1 件保存できる
  - 不正入力時に `4xx` を返す
  - 想定外失敗時に `5xx` と log が残る
- 想定テスト:
  - 正常な追加 request の確認
  - 空文字や長すぎる title の拒否確認
  - 保存失敗時の `5xx` 確認
- 証拠:
  - `apps/backend/src/routes/registerTodoRoutes.ts` に `POST /todos` route と schema を追加済み
  - `apps/backend/src/use-cases/createTodoUseCase.ts` に title 整形と Todo 作成処理を追加済み
  - `apps/backend/src/repositories/createSqliteTodoRepository.ts` に SQLite 保存処理を追加済み
  - `apps/backend/src/shared/requestError.ts` に `4xx` / `5xx` response 生成と validation 変換を追加済み
  - `apps/backend/src/app/createApp.test.ts` に `POST /todos` の 201 / 400 / 500 テストを追加済み
  - `apps/backend/src/use-cases/createTodoUseCase.test.ts` に use-case テストを追加済み
  - `apps/backend/src/repositories/createSqliteTodoRepository.test.ts` に repository 結合テストを追加済み
  - `README.md` に `POST /todos` の呼び出し例を追加済み
  - 標準環境で `npm run test --workspace @todo-ai-sandbox/backend` 実行済み
  - 標準環境で `npm run build --workspace @todo-ai-sandbox/backend` 実行済み
  - 標準環境で `TODO_AI_DATABASE_PATH=<temp>` を付けた `npm run db:migrate --workspace @todo-ai-sandbox/backend` 実行済み
  - 標準環境で `npm test` 実行済み

### T-005 `GET /todos` を schema 付きで実装する
- 目的: Todo 一覧取得 API を作り、保存済みデータを安全に読み出せる入口を作る。
- 範囲: route schema、use-case、repository の一覧取得、正常時 response
- 範囲外: Todo 追加 UI、完了更新、削除
- 失敗検知: 一覧取得失敗が `5xx` と log で追える状態にする。
- 被害限定: 一覧取得の不具合を更新や削除へ波及させない。
- 完了条件:
  - `GET /todos` が schema 付きで定義されている
  - 保存済み Todo を配列で返せる
  - 想定外失敗時に `5xx` と log が残る
- 想定テスト:
  - 空の一覧取得確認
  - 保存済み Todo の一覧取得確認
  - 保存層失敗時の `5xx` 確認
- 証拠:
  - `apps/backend/src/routes/registerTodoRoutes.ts` に `GET /todos` route と response schema を追加済み
  - `apps/backend/src/use-cases/getTodosUseCase.ts` に一覧取得 use-case を追加済み
  - `apps/backend/src/repositories/createSqliteTodoRepository.ts` に一覧取得と並び順を追加済み
  - `apps/backend/src/app/createApp.ts` に `GET /todos` 用の依存注入を追加済み
  - `apps/backend/src/app/createApp.test.ts` に `GET /todos` の空配列 / 一覧取得 / 500 テストを追加済み
  - `apps/backend/src/use-cases/getTodosUseCase.test.ts` に use-case テストを追加済み
  - `apps/backend/src/repositories/createSqliteTodoRepository.test.ts` に一覧取得テストを追加済み
  - `README.md` に `GET /todos` の呼び出し例を追加済み
  - 標準環境で `npm run test --workspace @todo-ai-sandbox/backend` 実行済み
  - 標準環境で `npm run build --workspace @todo-ai-sandbox/backend` 実行済み
  - 標準環境で `TODO_AI_DATABASE_PATH=<temp>` を付けた `npm run db:migrate --workspace @todo-ai-sandbox/backend` 実行済み
  - 標準環境で `npm test` 実行済み

### T-006 Frontend で Todo 一覧を表示する
- 目的: Backend の `GET /todos` を使って、Todo 一覧の最初の表示面を作る。
- 範囲: 一覧取得、読み込み中表示、空状態表示、失敗表示
- 範囲外: Todo 追加フォーム、完了更新、削除
- 失敗検知: 一覧取得失敗を画面上で確認でき、成功したように見せない状態にする。
- 被害限定: 一覧取得失敗を表示レイヤーに閉じ込め、他の操作へ波及させない。
- 完了条件:
  - Frontend が `GET /todos` を呼び出せる
  - 読み込み中、空状態、一覧表示、失敗表示がある
  - API が `500` を返したときに失敗表示が出る
- 想定テスト:
  - 空状態の表示確認
  - 保存済み Todo 一覧の表示確認
  - `500` 時の失敗表示確認
- 証拠:
  - `apps/frontend/src/features/todos/fetchTodos.ts` に `GET /todos` client と error 変換を追加済み
  - `apps/frontend/src/App.tsx` に読み込み中、空状態、一覧表示、失敗表示を追加済み
  - `apps/frontend/src/App.css` に一覧表示用の UI を追加済み
  - `apps/frontend/src/App.test.tsx` に loading / empty / success / error テストを追加済み
  - `apps/frontend/src/features/todos/fetchTodos.test.ts` に `GET /todos` client テストを追加済み
  - `apps/frontend/vite.config.ts` に開発時の `/todos` proxy を追加済み
  - `README.md` に Frontend の proxy 前提と `GET /todos` の利用前提を追加済み
  - 標準環境で `npm run test --workspace @todo-ai-sandbox/frontend` 実行済み
  - 標準環境で `npm run build --workspace @todo-ai-sandbox/frontend` 実行済み
  - 標準環境で `npm test` 実行済み

### T-007 Frontend で Todo を追加し、保存失敗を表示する
- 目的: Todo 追加フォームを作り、保存成功と保存失敗を画面上で区別できるようにする。
- 範囲: 入力フォーム、`POST /todos` 呼び出し、保存中表示、保存失敗表示、一覧更新
- 範囲外: 完了更新、削除
- 失敗検知: `POST /todos` の `4xx` / `5xx` を画面上で確認できる状態にする。
- 被害限定: 保存失敗をフォーム周辺に閉じ込め、一覧表示全体を壊さない。
- 完了条件:
  - Frontend から `POST /todos` を呼び出せる
  - 保存中表示がある
  - `4xx` と `5xx` の失敗表示がある
  - 保存成功後に一覧へ反映される
- 想定テスト:
  - 正常追加時の一覧更新確認
  - 空文字入力時の失敗表示確認
  - `500` 時の失敗表示確認
- 証拠:
  - `apps/frontend/src/features/todos/createTodo.ts` に `POST /todos` client と保存失敗の error 変換を追加済み
  - `apps/frontend/src/App.tsx` に Todo 追加フォーム、保存中表示、保存失敗表示、成功時の一覧更新を追加済み
  - `apps/frontend/src/App.css` に追加フォームと保存失敗表示の UI を追加済み
  - `apps/frontend/src/features/todos/createTodo.test.ts` に保存成功 / `4xx` / `5xx` の client テストを追加済み
  - `apps/frontend/src/App.test.tsx` に保存中 / 成功 / `4xx` / `5xx` の表示テストを追加済み
  - `README.md` に Frontend の Todo 追加と保存失敗確認ポイントを追加済み
  - 標準環境で `npm run test --workspace @todo-ai-sandbox/frontend` 実行済み
  - 標準環境で `npm run build --workspace @todo-ai-sandbox/frontend` 実行済み
  - 標準環境で `npm test` 実行済み
