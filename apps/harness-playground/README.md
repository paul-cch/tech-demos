# Harness Playground

Offline Bun + Vite + React + TypeScript demo inspired by
[learn-harness-engineering](https://github.com/walkinglabs/learn-harness-engineering).

Seed a small broken environment fixture, run a mock agent loop
(`plan → act → observe`), and watch verification checks flip fail → pass.

## Run

```bash
cd apps/harness-playground
bun install
bun run dev
```

## Build

```bash
bun run build
```

## Scope

Single-user MVP only — no real LLM, no network, no filesystem mutation.
See `PLAN.md`.
