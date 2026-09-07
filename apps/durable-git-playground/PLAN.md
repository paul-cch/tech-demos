# durable-git-playground Plan

## Goal

Teach one Durable Object (RepoCell) per git repository via a local cgit-style browser.

## Single-user MVP

**In scope**
- In-memory RepoCell with seeded toy commits, trees, blobs, refs
- Compact UI: sidebar with repo/cell label + main content
- Views: summary, log, tree, blob, commit diff
- Push-walkthrough panel (narrative cell-state steps)
- Bun + Vite + React + TypeScript build and dev scripts

**Out of scope**
- Real Cloudflare Workers or Durable Objects
- Real git smart HTTP or packfile handling
- Auth, private repos, R2, clone negotiation
- The published durable-git package

## Tasks

1. Scaffold Vite React-TS with app-local bunfig.toml
2. Plan and stack choices
3. Clean Tailwind UI (shadcn deferred if slow)
4. Implement RepoCell + seed data
5. Wire summary / log / tree / blob / commit views
6. Push-walkthrough narrative panel
7. Verify bun install, bun run build, bun run dev
8. Move bookmark to built in tracking/seen-bookmarks.json
9. Commit, push branch, open PR with artifacts if possible

## Stack

| Choice | Rationale |
|--------|-----------|
| Bun | Monorepo default runtime and installer |
| Vite + React + TS | Official scaffold; fast local demo |
| Tailwind CSS v4 | Compact UI without shadcn init friction |
| react-router-dom | Path views for cgit-style pages |
| In-memory RepoCell | Models one-DO-per-repo without Workers |

## Deferred

- Real Workers + Durable Object binding
- Pack ingest / smart HTTP (belongs in durable-git itself)
- Full cgit surface (blame, snapshots, feeds)
- Cloudflare Pages path deploy
- shadcn/ui polish pass

## Sources

- https://github.com/littledivy/durable-git
- https://x.com/undefined_void/status/2089703872583643363
