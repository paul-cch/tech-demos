# Harness Playground — Plan

## Goal

Single-user offline demo that walks a toy coding-agent **harness**: seed an environment fixture, run a mock agent loop with visible state, and show pass/fail verification checks — inspired by learn-harness-engineering.

## Single-user MVP

**In**
- Seed/select a small environment fixture (broken test, missing file, lint fail)
- Mock agent loop with visible steps/state: plan → act → observe
- Verification panel with pass/fail checks that update as the loop runs
- Compact single-page playground; fully offline / self-contained

**Out**
- Real LLM / network calls
- Multi-session handoff persistence
- Real shell / filesystem mutation
- Multi-user / auth / deploy wiring

## Tasks

1. Scaffold Bun Vite + React + TypeScript; add `bunfig.toml` before install
2. Model fixtures, harness state machine, and verification checks in pure TS
3. Build playground UI: fixture picker, agent loop timeline, verification panel
4. Wire a Run / Reset control that animates the mock loop end-to-end
5. Docs artifacts (screenshot + slideshow video) and README

## Stack

| Choice | Rationale |
|--------|-----------|
| Bun + Vite + React + TS | Monorepo convention; fast offline SPA |
| Tailwind CSS | Quick compact UI without bespoke CSS sprawl |
| In-memory fixtures | Offline demo; no backend |

## Deferred

- Real agent adapters (Claude Code / Codex)
- Exporting AGENTS.md / feature_list.json from the playground
- Cloudflare Pages path deploy
- Multi-session progress.md handoff simulation
