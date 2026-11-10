# LuminOS Docs (Astro + Starlight)

Documentation site for the **LuminOS** Shopify theme. Deploy on **Vercel** at `docs.lumintheme.com`. Community stays on Discourse (`community.lumintheme.com`). Activation app is a separate Vercel project later.

## Local development

```bash
npm install
npm run generate   # build section reference from ../LuminOS New
npm run dev        # http://localhost:4321
```

Override theme path if needed:

```bash
LUMINOS_THEME_PATH="/path/to/LuminOS New" npm run generate
```

## Content

| Path | Purpose |
| --- | --- |
| `src/content/docs/` | Guides and pages (MD/MDX) |
| `src/content/docs/sections/` | Auto-generated section/block reference |
| `public/images/` | Screenshots and static assets |
| `src/assets/` | Logos used by Starlight |
| `scripts/generate-docs.mjs` | Schema → Markdown generator |

Edit only inside `<!-- MANUAL:START -->` … `<!-- MANUAL:END -->` on generated pages so tips/videos survive re-runs.

## Deploy to Vercel

1. Push this folder to a GitHub repo (e.g. `luminos-astro-docs`).
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. Framework preset: **Astro** (auto-detected). Build: `npm run build`. Output: `dist`.
4. Add domain `docs.lumintheme.com` in Vercel → Domains, then create the DNS records Vercel shows (usually CNAME `docs` → `cname.vercel-dns.com`).
5. Optional build step: add `npm run generate` before build if the theme repo is available in CI; otherwise commit generated `sections/` pages.

## Brand

Colors and font match [lumintheme.com](https://lumintheme.com): accent `#0066CC`, **DM Sans**, dark-friendly backgrounds.
