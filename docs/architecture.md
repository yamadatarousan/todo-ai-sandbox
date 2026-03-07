# 最小構成アーキテクチャ

## この文書の目的
- この文書は、Todo アプリを最小構成で作るためのアーキテクチャ方針を固定する。
- 目的は機能を豪華にすることではなく、AI を使いながら失敗検知と被害限定を実践できる構成にすることである。
- 最小構成を超える仕組みは、必要性が説明できるまでは入れない。

## この段階で扱う機能
- Todo 一覧を取得できる
- Todo を追加できる
- Todo の完了状態を更新できる
- Todo を削除できる
- 削除前に確認を挟む

## この段階で扱わない機能
- 認証
- 複数ユーザー
- リアルタイム更新
- 添付ファイル
- 並び替え
- ラベルや期限
- 外部通知

## システム全体像
- `Frontend` は React の Single Page Application とする。
- `Backend` は Fastify の HTTP API とする。
- `Database` は SQLite とする。
- `Frontend` は `Backend` に対して HTTP でのみ通信する。
- `Frontend` は `Database` に直接触れない。
- `Backend` は `Database` に対する唯一の書き込み窓口とする。

## 最小ディレクトリ構成

```text
apps/
  frontend/
    src/
      app/
      features/todos/
      shared/
  backend/
    src/
      app/
      routes/
      use-cases/
      repositories/
      database/
      shared/
packages/
```

## 各領域の責務

### Frontend
- 画面表示、入力受付、読み込み中表示、エラー表示を担当する。
- API 通信の成功と失敗を利用者に見える形で扱う。
- 保存成功を先に確定表示しない。成功レスポンスを受け取ってから画面を更新する。
- 削除は確認ダイアログを通してから実行する。
- 想定外エラー時は「失敗した」ことを隠さず表示し、再試行できるようにする。

### Backend
- HTTP の入り口として request を検証し、response を整形する。
- 業務ルールを `use-cases` に集め、route に直接書き込みすぎない。
- `Database` への読み書きは `repositories` に閉じ込める。
- 想定した失敗は 4xx として返し、想定外の失敗は 5xx として返す。
- 想定外の失敗は logger に残し、原因を追えるようにする。

### Database
- Todo の永続化を担当する。
- 制約で守れるものは `Database` でも守る。
- `Backend` の不具合があっても、`Database` 側で壊れ方を狭める。

## Backend の最小レイヤー

### routes
- Fastify の route 定義を書く。
- `body`、`querystring`、`params`、`headers`、`response` の schema をここで定義する。
- request を `use-cases` に渡し、返り値を response に変換する。
- logger に必要な情報を残す起点にする。

### use-cases
- Todo の追加、一覧取得、完了更新、削除の業務ルールを書く。
- 入力値の意味に関する検証を行う。
- `repositories` を組み合わせるが、SQL は直接書かない。

### repositories
- SQLite と Drizzle ORM を使った読み書きを担当する。
- `Database` の詳細を `use-cases` へ漏らさない。
- 1 つの処理単位で必要な query をまとめる。

### database
- schema、migration、接続初期化を置く。
- Todo テーブルの制約をここで定義する。

## 最初に置くデータモデル

### todos
- `id`: 文字列の一意識別子
- `title`: Todo の本文
- `isCompleted`: 完了状態
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

## データモデルの制約
- `title` は空文字を許可しない。
- `title` は長すぎる値を許可しない。
- 削除は 1 件単位で行う。
- 一覧取得の失敗と削除処理の失敗は分離する。

## API の最小構成
- `GET /todos`
- `POST /todos`
- `PATCH /todos/:id`
- `DELETE /todos/:id`

## API の設計方針
- すべての route に Fastify schema を必須とする。
- schema のない route を追加しないために、後で route 登録 helper を入れられる形にしておく。
- 正常系 response と異常系 response の形をできるだけ固定する。
- `4xx` は利用者または呼び出し側が対処できる失敗とする。
- `5xx` は想定外失敗として扱い、logger に残す。

## Frontend の最小構成
- `features/todos` に Todo 一覧、追加フォーム、完了切り替え、削除操作をまとめる。
- `shared` に API 呼び出し、共通 UI、共通型を置く。
- state はまず画面ローカルの state と素朴な `fetch` で始める。
- データ取得ライブラリは、失敗の流れが見えにくくなるまでは入れない。

## 失敗検知の設計
- 保存失敗時は、画面上で成功したように見せない。
- API が `4xx` を返したら、入力や操作の問題として利用者に伝える。
- API が `5xx` を返したら、利用者には失敗を伝え、詳細は Backend の logger で追えるようにする。
- validation 失敗時は、どの入力が原因か分かる形で response を返す。
- 想定外エラー時は request 単位で追える識別子をログに残せるようにする。

## 被害限定の設計
- 一覧取得と更新処理の責務を分け、一覧の不具合が削除や更新へ波及しにくい形にする。
- 削除は確認操作を挟み、即時実行しない。
- 1 回の API で必要以上に多くの Todo を変更しない。
- `Database` 制約と transaction を使い、途中失敗で中途半端な状態を作りにくくする。
- 危険な設定や運用コマンドは最初から置かない。

## ログと観測の最小方針
- Backend は request ごとにログを残す。
- 想定外エラーは stack trace を含めて記録できる形にする。
- 利用者に返すメッセージと、内部ログに残す詳細は分ける。
- Frontend では最低限、失敗を利用者に表示する。詳細な監視基盤はまだ入れない。

## テストの最小方針
- `use-cases` は厳密 TDD で進める。
- `repositories` は SQLite を使った結合テストで確認する。
- `routes` は schema による validation と status code をテストで確認する。
- `Frontend` は画面操作に対する表示変化をテストする。
- 重要な流れは Playwright で End-to-End テストを置く。

## 最初の End-to-End テスト対象
- Todo を追加できる
- 不正な入力では追加できず、原因が分かる
- API 失敗時に成功表示にならない
- Todo 削除前に確認が出る

## 今は入れないもの
- Background job
- Message queue
- Cache
- WebSocket
- 外部監視サービス
- 複雑な状態管理ライブラリ
- OpenAPI を中心にした code generation

## 今は入れない理由
- どれも有用になりうるが、最小構成の段階では学習対象をぼかしやすい。
- まずは request、response、log、database 制約の 4 点で失敗検知と被害限定を実践する。

## 見直しの合図
- route schema の重複が増え、契約共有が必要になったとき
- Frontend の `fetch` と local state だけでは失敗状態の管理が複雑になったとき
- SQLite では扱いにくい同時更新や運用課題が見えてきたとき
- ローカルログだけでは不具合追跡が足りなくなったとき
