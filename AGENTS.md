# AGENTS.md — sticky tech-demos monorepo

Operating guide for Cursor cloud agents working in this repo.

## Scope

- One sticky monorepo for every weekday X-bookmark tech demo.
- Each demo lives under `apps/<kebab-slug>/` and must be self-contained: `bun install && bun run dev`.
- Never create a new GitHub repository for a demo.

## What you may touch

- Add/update files under `apps/<slug>/` for the demo you are building.
- Update `tracking/seen-bookmarks.json` when recording a pick (proposed / skipped / built).
- Do not rewrite unrelated apps or repo-wide tooling unless the task explicitly asks.

## Planning

- Before coding, follow `skills/project-planning/SKILL.md`.
- Write `apps/<slug>/PLAN.md` with goal, MVP scope, tasks, stack, and deferred items.

## Bun

- Use Bun as runtime, package manager, and script runner.
- Before any `bun install` / `bun add` in a new app, ensure that app has a `bunfig.toml` with:

```toml
[install]
minimumReleaseAge = 259200
```

## PR validation (required)

Every demo PR must attach **both**:

1. at least one screenshot of the running app, and
2. at least one video of the running app.

These are not optional.

## Deploy notes

Prefer one Cloudflare Pages project with a path per `apps/<slug>/` (not one project per app). When deploy is wired later, GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` live on this repository — do not invent secrets here.
