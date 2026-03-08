# todo-ai-sandbox

Todo アプリを題材に、AI を使った実装での失敗検知と被害限定を学ぶためのリポジトリ。

## 開発コマンド
- 依存関係の導入: `npm install`
- Frontend の起動: `npm run dev:frontend`
- Backend の起動: `npm run dev:backend`
- Backend の migration 実行: `npm run db:migrate --workspace @todo-ai-sandbox/backend`
- Frontend のテスト: `npm run test:frontend`
- Backend のテスト: `npm run test:backend`
- workspace 全体のテスト: `npm test`

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

- `GET /todos` は新しい Todo を先に返す
- 不正な入力や想定外エラーの response には `requestId` が含まれる
