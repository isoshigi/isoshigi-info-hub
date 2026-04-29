# いそしぎ忘備録

検証結果や試行記録を「物語として完成させ」、小さな成果として蓄積していくアウトプット共有サイト。
「成長を加速する行動マニフェスト2026」の考え方を実践するための土台。

## 技術スタック

- **フレームワーク**: Astro
- **コンテンツフォーマット**: MDX
- **スタイリング**: Tailwind CSS
- **ホスティング・CDN**: Cloudflare R2 + CDN
- **アクセス解析**: Cloudflare Web Analytics

## ディレクトリ構成

```
/
├── public/                  # 静的アセット
│   ├── favicon.svg
│   └── favicon.ico
├── scripts/
│   └── generate-og-images.mjs  # ビルド時OGP画像生成スクリプト
├── src/
│   ├── components/          # Astroコンポーネント
│   │   ├── OGImageCard.astro
│   │   ├── ShareButton.astro
│   │   └── SummaryCard.astro
│   ├── content/             # コンテンツデータ
│   │   ├── articles/        # 技術記事（*.mdx）
│   │   └── events/          # イベント参加記録（*.mdx）
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/               # ページルーティング
│   │   ├── index.astro
│   │   ├── pages/index.astro
│   │   ├── articles/[slug].astro
│   │   └── tmp/og.astro     # OGP画像生成用（ビルド後に削除）
│   ├── styles/
│   │   └── global.css
│   └── content.config.ts    # コンテンツスキーマ定義
├── templates/               # コンテンツテンプレート
│   ├── article.mdx
│   └── event.mdx
├── doc/                     # 設計ドキュメント
│   ├── content-data-structure.md
│   ├── inception-deck.md
│   ├── page-structure.md
│   ├── style-guide.md
│   └── user-story-mapping.md
├── astro.config.mjs
└── mise.toml
```

## 使い方

### 執筆（新規記事の追加）

1. `src/content/articles/` に `slug.mdx` を新規作成する。
2. フロントマターに必須情報を記入する。

```mdx
---
title: "記事タイトル"
description: "記事の概要（200文字以内）"
publishedAt: 2026-04-29
tags: ["astro", "tailwindcss"]
draft: false
coverImage: "/images/my-image.png"
---

## はじめに

本文を書く。
```

- `coverImage` は省略可能。指定すると `SummaryCard` のサムネイルとして表示される。

3. 開発サーバーで確認する。

```sh
npm run dev
```

4. ビルドする。

```sh
npm run build
```

ビルド結果は `./dist/` に出力される。

### テンプレートから作成する

`templates/` ディレクトリに雛形を用意している。コピーして使う。

```sh
# 技術記事の場合
cp templates/article.mdx src/content/articles/my-post.mdx

# イベント参加記録の場合
cp templates/event.mdx src/content/events/my-event.mdx
```

### イベント参加記録の追加

`src/content/events/` に MDX を配置する。イベントは個別ページを持たず、`/pages` 共通一覧に表示される。

```mdx
---
title: "イベント参加記録タイトル"
description: "概要"
publishedAt: 2026-04-20
eventDate: 2026-04-20
eventName: "イベント名"
location: "offline"
draft: false
---

## 得られた知見

本文を書く。
```

- `location` は `"online"` または `"offline"` を指定する。

## OGP 画像の自動生成

`npm run build` 実行時に、Playwright を使用して自動的に OGP 画像（1200×630px）が生成される。

- トップページ: `/img/og.png`
- `/pages` 一覧: `/img/pages/og.png`
- 各記事: `/img/articles/{slug}/og.png`

`coverImage` の有無に関わらず、タイトル・説明・公開日・タグなどから OG 画像が生成される。個別のOG画像が不要な場合でも、ホームページ用の `/img/og.png` がフォールバックとして使用される。

## デプロイ手順

### 初回のみ

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) で R2 バケットを作成する。
2. Cloudflare Pages または Workers + R2 でホスティングを設定する。

### 毎回

1. ビルドする。

```sh
npm run build
```

2. `./dist/` の内容を R2 バケット（または Pages のプロジェクト）にアップロードする。

```sh
# wrangler を使う場合の例
wrangler pages deploy dist
```

または、R2 に直接アップロードする場合:

```sh
wrangler r2 object put <bucket-name>/index.html --file dist/index.html
# 他のファイルも同様
```

デプロイ自動化は v0.2 以降で検討する。v0.1 では手動デプロイを許容する。

## Analytics

アクセス解析は Cloudflare Web Analytics で行う。[Cloudflare ダッシュボード](https://dash.cloudflare.com/) でサイトを追加して有効化する。HTML にスクリプトタグを埋め込む必要はない（Cloudflare エッジで自動挿入される）。

## 開発コマンド

| Command         | Action                                      |
| :-------------- | :------------------------------------------ |
| `npm install`   | 依存関係をインストールする                   |
| `npm run dev`   | 開発サーバーを起動する（localhost:4321）     |
| `npm run build` | 本番用にビルドする（./dist/ に出力）         |
| `npm run preview` | ビルド結果をローカルでプレビューする        |
