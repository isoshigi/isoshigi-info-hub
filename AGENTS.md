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

- **`articles`** → `src/content/articles/*.mdx`
  - Rendered at `/articles/{slug}` (`[slug].astro`).
  - Schema: `title`, `description` (max 200 chars), `publishedAt`, `updatedAt?`, `tags?`, `draft?` (default false), `coverImage?`, `series?`, `seriesOrder?`.
- **`events`** → `src/content/events/*.mdx`
  - **No individual pages**. Listed only on `/pages` and the home page.
  - Schema: `title`, `description` (max 200 chars), `publishedAt`, `updatedAt?`, `tags?`, `draft?`, `coverImage?`, `eventName`, `eventDate`, `location?` (`'online'` | `'offline'`).

### Schema Quirks
- `tags` are auto-deduplicated and empty strings are filtered out.
- `draft: true` excludes items from all collection queries (both collections filter by `!data.draft`).

## Adding Content

Use the templates rather than writing frontmatter from scratch:

```sh
# New article
cp templates/article.mdx src/content/articles/my-post.mdx

# New event record
cp templates/event.mdx src/content/events/my-event.mdx
```

## Styling Constraints

Follow the existing convention (executable truth in `src/styles/global.css`):
- **Colors**: Only Tailwind `sky` and `slate` families. Custom colors are defined as CSS variables under `@theme`.
- **Fonts**: System font stack only. No web fonts.
- **Interactions**: Minimal. Hover color transitions are acceptable; no animations or complex transitions.
- **Layout**: Mobile-first, max-width container, sidebar on larger screens.

## Deploy

- **Target**: Cloudflare (R2 + CDN / Pages).
- **Site URL**: `https://isoshigi.dev`
- **Command**: `npx wrangler deploy`
- CI/CD is configured via GitHub Actions (see `.github/workflows/deploy.yml`).

## Analytics

Cloudflare Web Analytics script has been removed from `src/layouts/BaseLayout.astro`. Analytics is intended to be injected automatically at the Cloudflare edge level instead.

## OGP Generation

OGP images are automatically generated at build time via Playwright.

- **`src/pages/tmp/og.astro`**: Renders invisible OG image cards for every public article plus the home and `/pages` pages.
- **`scripts/generate-og-images.mjs`**: Starts a local static server, opens `/tmp/og/` in a headless Chromium viewport (1200×630), screenshots each `.og-card-wrapper`, and saves them to:
  - `/img/og.png` (home page)
  - `/img/pages/og.png` (`/pages` listing)
  - `/img/articles/{slug}/og.png` (each article)
- After generation the `dist/tmp/` directory is deleted so it is never published.
- `coverImage` is **not** used for OG images; it is only for the card thumbnail shown in `SummaryCard` lists.
