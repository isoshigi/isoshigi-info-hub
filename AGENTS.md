# Agent Guide for isoshigi-info-hub

Compact instructions to avoid common mistakes in this Astro static site.

## Toolchain & Environment

- **Node**: >=22.12.0 (mise.toml pins `24`).
- **mise**: Run `eval "$(mise activate bash)"` before any npm/pnpm commands in a new shell. Or use `mise exec -- npm <cmd>` to auto-activate.
- **Framework**: Astro v6.1.10, TypeScript strict (`astro/tsconfigs/strict`).
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin.
  - **No `tailwind.config.js`**. Theme tokens live in `src/styles/global.css` using `@theme` and CSS variables.
  - Dark mode is already implemented via `prefers-color-scheme: dark` in that file.
- **No test, lint, or typecheck scripts** exist. `npm run build` is the only verification step.

## Developer Commands

| Command | Action |
| :------ | :----- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview built output locally |

## Content Architecture

Content is managed via Astro content collections defined in `src/content.config.ts`.
All content types share a common schema with a body (MDX) and are listed on **`/pages`** and the home page.

- **`articles`** → `src/content/articles/*.mdx`
  - Rendered at `/articles/{slug}` (`[slug].astro`).
  - Schema: `title`, `description` (max 200 chars), `publishedAt`, `updatedAt?`, `tags?`, `draft?` (default false), `coverImage?`.

- **`slides`** → `src/content/slides/*.mdx`
  - Rendered at `/slides/{slug}` (`[slug].astro`).
  - Schema: Common schema + `theme?` (string).
  - Body is composed of `<Slide>` components wrapping prose content. Each slide is an aspect-video card in a slide viewer.

- **`stories`** → `src/content/stories/*.mdx`
  - Rendered at `/stories/{slug}` (`[slug].astro`).
  - Schema: Common schema + `storyFlow` (string array, min 1).

- **`scraps`** → `src/content/scraps/*.mdx`
  - Rendered at `/scraps/{slug}` (`[slug].astro`).
  - Schema: Common schema (no extra fields).
  - Body is composed of `<ScrapEntry>` components, each with an optional `type` prop (`'note'` | `'quote'` | `'code'` | `'link'`) that controls visual styling. No size constraints.

### Listing Pages
| URL | Content Types Shown |
|-----|---------------------|
| `/pages` | articles, slides, stories, scraps |
| `/` (home) | Latest items from all content types |

### Schema Quirks
- `tags` are auto-deduplicated and empty strings are filtered out.
- `draft: true` excludes items from all collection queries (articles filter by `!data.draft`).

## Adding Content

Use the templates rather than writing frontmatter from scratch:

```sh
# New article
cp templates/article.mdx src/content/articles/my-post.mdx

# New slide
cp templates/slide.mdx src/content/slides/my-slide.mdx

# New story
cp templates/story.mdx src/content/stories/my-story.mdx

# New scrap
cp templates/scrap.mdx src/content/scraps/my-scrap.mdx
```

## Styling Constraints

Follow the existing convention (executable truth in `src/styles/global.css`):
- **Colors**: Only Tailwind `sky` and `slate` families. Custom colors are defined as CSS variables under `@theme`.
- **Fonts**: System font stack only. No web fonts.
- **Interactions**: Minimal. Hover color transitions are acceptable; no animations or complex transitions.
- **Layout**: Mobile-first, max-width container, sidebar on larger screens.

## Deploy

- **Target**: Cloudflare Workers Static Assets.
- **Site URL**: `https://isoshigi.dev`
- **Command**: `npx wrangler deploy`
- CI/CD is configured via GitHub Actions (see `.github/workflows/deploy.yml`).

## Analytics

Cloudflare Web Analytics script has been removed from `src/layouts/BaseLayout.astro`. Analytics is intended to be injected automatically at the Cloudflare edge level instead.

## OGP Generation & PDF Export

OGP images and slide PDFs are automatically generated at build time via a single Playwright session.

- **`src/pages/tmp/og.astro`**: Renders invisible OG image cards for every public article, slide, story, and scrap plus the home and `/pages` pages.
- **`scripts/postbuild.mjs`**: Starts a local static server, opens `/tmp/og/` in a headless Chromium instance, screenshots each `.og-card-wrapper`, then generates PDFs for each slide page. Saves to:
  - `/img/og.png` (home page)
  - `/img/pages/og.png` (`/pages` listing)
  - `/img/articles/{slug}/og.png` (each article)
  - `/img/slides/{slug}/og.png` (each slide)
  - `/img/stories/{slug}/og.png` (each story)
  - `/img/scraps/{slug}/og.png` (each scrap)
  - `/pdf/slides/{slug}.pdf` (each slide, A4, print media emulation)
- After generation the `dist/tmp/` directory is deleted so it is never published.
- `coverImage` is **not** used for OG images; it is only for the card thumbnail shown in `SummaryCard` lists.
