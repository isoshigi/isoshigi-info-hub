# いそしぎ忘備録

検証結果や試行記録を「物語として完成させ」、小さな成果として蓄積していくアウトプット共有サイト。
「成長を加速する行動マニフェスト2026」の考え方を実践するための土台。

## 技術スタック

- **フレームワーク**: Astro
- **コンテンツフォーマット**: MDX
- **スタイリング**: Tailwind CSS
- **ホスティング・CDN**: Cloudflare Workers Static Assets
- **アクセス解析**: Cloudflare Web Analytics

## ディレクトリ構成

```
/
├── public/                  # 静的アセット
│   ├── favicon.svg
│   └── favicon.ico
├── scripts/
│   └── postbuild.mjs        # ビルド時OGP画像生成・スライドPDF出力スクリプト
├── src/
│   ├── components/          # Astroコンポーネント
│   │   ├── content/         # コンテンツ用コンポーネント
│   │   │   ├── ScrapEntry.astro
│   │   │   └── SlideCard.astro
│   │   ├── internal/        # 内部用コンポーネント
│   │   │   └── OGImageCard.astro
│   │   └── ui/              # UIコンポーネント
│   │       ├── PageFooter.astro
│   │       ├── ShareButton.astro
│   │       └── SummaryCard.astro
│   ├── content/             # コンテンツデータ
│   │   ├── articles/        # 技術記事（*.mdx）
│   │   ├── scraps/          # 調べ物（*.mdx）
│   │   ├── slides/          # スライド（*.mdx）
│   │   └── stories/         # ストーリー（*.mdx）
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── ContentLayout.astro
│   ├── lib/                 # ユーティリティ
│   │   ├── contents.ts
│   │   ├── draftFilter.ts
│   │   ├── formatDate.ts
│   │   ├── typeLabels.ts
│   │   └── types.ts
│   ├── pages/               # ページルーティング
│   │   ├── index.astro
│   │   ├── pages/index.astro
│   │   ├── articles/[slug].astro
│   │   ├── scraps/[slug].astro
│   │   ├── slides/[slug].astro
│   │   ├── stories/[slug].astro
│   │   └── tmp/og.astro     # OGP画像生成用（ビルド後に削除）
│   ├── styles/
│   │   ├── global.css
│   │   └── prose.css
│   └── content.config.ts    # コンテンツスキーマ定義
├── templates/               # コンテンツテンプレート
│   ├── article.mdx
│   ├── scrap.mdx
│   ├── slide.mdx
│   └── story.mdx
├── doc/                     # 設計ドキュメント
│   ├── content-data-structure.md
│   ├── inception-deck.md
│   ├── page-structure.md
│   ├── style-guide.md
│   └── user-story-mapping.md
├── astro.config.mjs
├── mise.toml
└── wrangler.toml
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

# スライドの場合
cp templates/slide.mdx src/content/slides/my-slide.mdx

# ストーリーの場合
cp templates/story.mdx src/content/stories/my-story.mdx

# 調べ物の場合
cp templates/scrap.mdx src/content/scraps/my-scrap.mdx
```

## OGP 画像の自動生成

`npm run build` 実行時に、Playwright を使用して自動的に OGP 画像（1200×630px）とスライド PDF が生成される。

- トップページ: `/img/og.png`
- `/pages` 一覧: `/img/pages/og.png`
- 各記事: `/img/articles/{slug}/og.png`
- 各調べ物: `/img/scraps/{slug}/og.png`
- 各スライド: `/img/slides/{slug}/og.png`
- 各ストーリー: `/img/stories/{slug}/og.png`
- スライド PDF: `/pdf/slides/{slug}.pdf`

`coverImage` の有無に関わらず、タイトル・説明・公開日・タグなどから OG 画像が生成される。個別のOG画像が不要な場合でも、ホームページ用の `/img/og.png` がフォールバックとして使用される。

## デプロイ手順

### 初回のみ

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) で API トークンを発行する。
2. `wrangler.toml` の設定を確認する。

### 手動デプロイ

1. ビルドする。

```sh
npm run build
```

2. Cloudflare Workers Static Assets にデプロイする。

```sh
npx wrangler deploy
```

または:

```sh
npm run deploy
```

### 自動デプロイ

`main` ブランチへの push をトリガーに、GitHub Actions（`.github/workflows/deploy.yml`）が自動的にビルド・デプロイを行う。バージョン番号は `test/v*` または `feat/v*` ブランチからの PR マージ時に自動で minor バージョンアップされる。

## Analytics

アクセス解析は Cloudflare Web Analytics で行う。[Cloudflare ダッシュボード](https://dash.cloudflare.com/) でサイトを追加して有効化する。HTML にスクリプトタグを埋め込む必要はない（Cloudflare エッジで自動挿入される）。

## 開発コマンド

| Command         | Action                                      |
| :-------------- | :------------------------------------------ |
| `npm install`   | 依存関係をインストールする                   |
| `npm run dev`   | 開発サーバーを起動する（localhost:4321）     |
| `npm run build` | 本番用にビルドする（./dist/ に出力）         |
| `npm run preview` | ビルド結果をローカルでプレビューする        |
| `npm run deploy` | Cloudflare Workers Static Assets にデプロイする |
