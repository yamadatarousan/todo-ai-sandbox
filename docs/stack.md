# 技術スタック

## この文書の位置づけ
- この文書は、Todo アプリの初期技術スタックを固定するためのメモである。
- 2026-03-07 時点の採用案であり、学習目的に合わなくなった場合は見直す。
- 目的は「素早く作ること」単体ではなく、AI を使いながら失敗検知と被害限定を実践できる構成にすることである。

## 採用する技術
- 開発言語: TypeScript
- 実行環境: Node.js `v24.14.0` の Active Long Term Support
- パッケージ管理: npm `v11.9.0` + npm workspaces
- Frontend: React 19 系 + Vite
- Backend: Fastify 5 系
- Database: SQLite
- Database アクセス: Drizzle ORM
- 単体テストと結合テスト: Vitest
- 画面テスト: React Testing Library
- End-to-End テスト: Playwright
- ログ: Fastify の logger 設定を有効化し、Pino を使う

## 想定する構成
- リポジトリは 1 つにまとめる。
- Frontend と Backend は分ける。
- 初期のディレクトリ構成は次を想定する。

```text
apps/
  frontend/
  backend/
packages/
```

## Frontend と Backend の境界方針
- Frontend と Backend の境界には、最初から契約を置く。
- ただし、最初から OpenAPI を手書きして code generation まで前提にする構成にはしない。
- 最初に強制するのは OpenAPI 文書ではなく、Backend で実行時に検証される request と response の schema である。
- Fastify の route schema を使い、`body`、`querystring`、`params`、`headers`、`response` を定義する。
- schema がない route を安易に追加しないように、route 登録は薄い helper で包むことを前提にする。
- 将来的に schema の共有が必要になったら、`packages/api-contract` のような共有場所を作り、Frontend からも同じ契約を参照できるようにする。
- OpenAPI 文書が必要になったら、後から生成する。最初から文書を中心に据えない。

## この構成を採用する理由
- TypeScript に統一すると、AI に渡す前提知識が減る。生成速度、修正速度、レビュー速度のバランスがよい。
- 新規開発なので、Node.js は Maintenance Long Term Support ではなく Active Long Term Support を採用する。新しい基盤を、最初から古い維持フェーズの版に合わせない。
- Frontend と Backend を分けると、保存失敗、入力不正、HTTP 500、再試行、確認ダイアログといった失敗の境界が見えやすい。今回の学習目的に合う。
- Fastify は schema ベースで request の validation と response の serialization を扱える。失敗検知の出発点を作りやすい。
- Fastify は logger を素直に有効化できる。API の異常系を「画面では見えないが記録には残る」状態にしやすい。
- SQLite は起動コストが低い。小さく始めやすい一方で、制約、トランザクション、削除の安全性など、被害限定の基本は十分に学べる。
- Drizzle ORM は TypeScript で schema を明示しやすい。AI が生成した変更差分も人間が追いやすい。
- Vitest は Vite との相性がよく、Frontend と Backend の両方で揃えて使いやすい。
- React Testing Library は実装詳細ではなく、利用者の振る舞いに寄せて画面を確認しやすい。
- Playwright は画面と API をまたぐ確認がしやすい。保存失敗時の表示、削除確認、一覧再読み込み失敗などを End-to-End で押さえやすい。

## 境界方針をこの形にする理由
- Frontend と Backend の契約が曖昧だと、AI が両側を同時に触ったときに不整合を静かに持ち込みやすい。
- Fastify の route schema を最初から必須にすると、想定外入力や想定外 response を Backend 側で止めやすい。
- OpenAPI を最初から中心に据えると、文書、生成物、実装の 3 つを管理する構成になりやすく、今回の学習目的には重くなりやすい。
- まずは実行時に効く契約を優先し、OpenAPI は必要が生じた時点で追加する方が、AI を使う意味を損ないにくい。

## 今は採用しないもの
- Next.js のような Frontend と Backend が強く一体化した構成
- PostgreSQL
- Docker
- TanStack Query のようなデータ取得専用ライブラリ
- React Hook Form のようなフォーム専用ライブラリ
- 外部監視サービス
- OpenAPI を中心にした spec-first と code generation 前提の構成

## 今は採用しない理由
- 一体化した構成は便利だが、今回の学習では失敗の境界を見えやすくしたい。最初は分離した方が学びやすい。
- PostgreSQL と Docker は有用だが、初期の起動コストと運用コストが増える。まずは SQLite で十分である。
- データ取得やフォームの専用ライブラリは便利だが、最初から入れると失敗の流れをライブラリの内側に隠しやすい。まずは素朴な構成で失敗を観測できるようにする。
- 外部監視サービスは将来的には有力だが、まずはアプリ内ログ、テスト、再現手順の整備を優先する。
- OpenAPI を中心にした構成は有力だが、最初から入れると保証のための仕組みが重くなりやすい。最初は Fastify の route schema を境界契約として運用する。

## 見直し条件
- 同時更新や並行実行の問題を扱いたくなり、SQLite では学習しにくくなった場合は PostgreSQL へ移行する。
- Frontend の状態管理が複雑になり、素朴な `fetch` と local state では失敗の扱いが見通しづらくなった場合は専用ライブラリを追加する。
- 開発が進み、ローカル再現だけでは不十分になった場合は Continuous Integration と外部監視を追加する。

## 技術選定の方針
- 便利そうだから入れる、ではなく、失敗検知か被害限定のどちらに効くのかを説明できるものだけを採用する。
- AI の速度を活かすため、初期構成は小さく保つ。
- ただし、軽さを優先するあまり観測不能な失敗を増やさない。
- テストを通すこと自体を目的にせず、失敗したときに原因へ辿れることを重視する。
- 手元で一時的に別の版を使って動作確認したとしても、それを標準環境へ格上げしない。採用する版は文書に明記して管理する。
