# tech-demos

Sticky monorepo for weekday X-bookmark tech demos.

Each pick becomes a small single-user MVP under `apps/<slug>/`. A scout proposes one technology at a time; after approval, a Cursor cloud agent plans with the vendored project-planning skill and opens a PR with screenshot + video validation.

## Layout

```
AGENTS.md
README.md
bunfig.toml
apps/                  # one demo per kebab-slug
skills/project-planning/
tracking/seen-bookmarks.json
```

## Conventions

- Bun only; see `AGENTS.md`.
- Never one GitHub repo per demo — everything lands here.
- Cloudflare Pages: one project, path per app (when wired).
