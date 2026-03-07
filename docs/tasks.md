# タスク一覧

## このファイルの位置づけ
- このファイルを、現時点のタスク管理の正本とする。
- `進行中` は常に 1 件までにする。
- `完了` に移すときは、テスト結果やコミット識別子などの証拠を残す。

## 進行中
- なし

## 次

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
- 証拠: 未着手

## 候補
- T-002 Backend の最小起動と request logging を入れる
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
- なし
