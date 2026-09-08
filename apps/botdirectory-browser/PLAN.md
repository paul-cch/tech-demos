# botdirectory-browser — PLAN

## Goal

A tiny offline browser for agent-bot prompt markdowns: search/filter a handful of sample bots, preview the prompt, one-click copy.

## Single-user MVP

**In**
- Vendored sample bot markdown files (5–8) bundled with the app — no network to botdirectory.ai
- List view with search/filter by name and tags
- Detail/preview pane: rendered markdown + raw prompt toggle
- One-click copy prompt to clipboard
- Clean compact UI (Vite + React + TS + Tailwind)

**Out**
- Auth, accounts, ratings, submissions
- Fetching live bots from botdirectory.ai / GitHub
- Editing or authoring bots in-app
- Backend / persistence
- Deploy wiring (Cloudflare Pages later)

## Tasks (outcome-oriented)

1. Scaffold Vite React-TS app with Bun; add bunfig.toml + Tailwind
2. Vendor sample bot markdowns + a tiny in-app catalog (name, tags, prompt body)
3. Build list + search/filter UI
4. Build detail pane with markdown preview and copy-to-clipboard
5. Verify `bun install && bun run build`; capture screenshot/video artifacts

## Stack

| Choice | Rationale |
|--------|-----------|
| Bun | Repo standard runtime / package manager / script runner |
| Vite + React + TS via `create-vite` | Official scaffold; fast SPA for a one-screen utility |
| Tailwind CSS | Durable-git playground pattern; faster than full shadcn for a tiny MVP |
| `react-markdown` | Render bot prompt markdown without a custom parser |
| Vendored `.md` samples via Vite `?raw` imports | Offline, self-contained, no runtime network |

## Deferred

- shadcn/ui polish (not needed for one-screen MVP)
- Live sync / clone from [elie222/botdirectory.ai](https://github.com/elie222/botdirectory.ai)
- Tag taxonomy / categories beyond free-text tags
- Cloudflare Pages path deploy
- Shareable deep-link per bot (`?bot=slug`)
