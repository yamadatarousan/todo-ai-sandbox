# todo-ai-sandbox

Todo アプリを題材に、AI を使った実装での失敗検知と被害限定を学ぶためのリポジトリ。

## 標準実行環境
- `node -v`: `v24.14.0`
- `npm -v`: `11.9.0`
- ずれている場合は `exec zsh -l` または `nvm use 24.14.0` を実行し、その後で `npm install` をやり直す
- 標準実行環境と異なるまま `install` / `dev` / `build` / `test` / `db:migrate` を実行すると、guard が先に止める

## 開発コマンド
- 依存関係の導入: `npm install`
- Frontend の起動: `npm run dev:frontend`
- Backend の起動: `npm run dev:backend`
- Backend の migration 実行: `npm run db:migrate --workspace @todo-ai-sandbox/backend`
- Frontend のテスト: `npm run test:frontend`
- Backend のテスト: `npm run test:backend`
- workspace 全体のテスト: `npm test`
- Playwright E2E: `npm run test:e2e`
- 開発時は Frontend の `/todos` を Vite proxy で Backend `http://127.0.0.1:3001` へ流す
- Playwright E2E は Frontend と Backend を自動起動し、`data/e2e/app.sqlite` を毎回作り直して使う

## Frontend の確認ポイント
- Todo 一覧は起動時に `GET /todos` を呼び出して表示する
- Todo 追加フォームは `POST /todos` を呼び出し、保存成功時だけ一覧を更新する
- 保存が `4xx` / `5xx` で失敗したときは、フォーム周辺に message / issue / `requestId` を表示する
- Todo の完了切り替えは `PATCH /todos/:id` を呼び出し、更新成功時だけ対象行を更新する
- 完了更新が `404` / `500` で失敗したときは、対象の Todo 行に message と `requestId` を表示する
- Todo 削除は確認ダイアログを経由して `DELETE /todos/:id` を呼び出し、成功時だけ対象行を一覧から外す
- 削除が `404` / `500` で失敗したときは、確認ダイアログ内に message と `requestId` を表示する

## Backend のログ
- ログファイル: `logs/backend/app.log`
- ログ確認: `tail -f logs/backend/app.log`

## Backend の Database
- 既定の SQLite ファイル: `data/backend/app.sqlite`
- 一時パスで migration を試す例: `TODO_AI_DATABASE_PATH=/tmp/todo-ai-sandbox.sqlite npm run db:migrate --workspace @todo-ai-sandbox/backend`

## Backend の API
- Todo 一覧の取得:

```bash
curl http://127.0.0.1:3001/todos
```

- Todo の追加:

```bash
curl -X POST http://127.0.0.1:3001/todos \
  -H 'content-type: application/json' \
  -d '{"title":"最初の Todo"}'
```

- Todo の完了切り替え:

```bash
curl -X PATCH http://127.0.0.1:3001/todos/<todo-id> \
  -H 'content-type: application/json' \
  -d '{"isCompleted":true}'
```

- Todo の削除:

```bash
curl -X DELETE http://127.0.0.1:3001/todos/<todo-id>
```

- `GET /todos` は新しい Todo を先に返す
- `PATCH /todos/:id` は存在しない Todo に `404` を返す
- `DELETE /todos/:id` は存在しない Todo に `404` を返す
- 不正な入力や想定外エラーの response には `requestId` が含まれる
