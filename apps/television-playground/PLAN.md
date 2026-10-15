# Television playground — Plan

## Goal

A single-user screen where an agent’s pins land on named channels, so the idea of Television is visible without installing the real server.

## Single-user MVP

**In**

- Two channels, Today and Work, switched from a left rail
- Seeded artifact cards (status, checklist, week strip, draft note, three-row table)
- Checkboxes that toggle
- A “Put on TV” title box that pins a new card on the current channel
- Remove any card
- Persist the board in localStorage

**Out**

- The real Television server, Node 24, or an agent harness
- Accounts, a backend, or a real LLM
- Publishing or deploying

## Tasks

1. Scaffold Bun + Vite + React + TypeScript with `bunfig.toml` before install
2. Seed both channels and render a channel board, not a transcript
3. Wire channel switch, checkbox toggle, pin, and take-down
4. Persist to localStorage
5. Production build, then screenshot and a short tour

## Stack

| Choice | Rationale |
|--------|-----------|
| Bun + Vite + React + TS | Same shape as the other demos; one screen, no framework past Vite |
| Plain CSS | CRT channel board, not a component kit |
| localStorage | No backend; pins survive a refresh |

## Deferred

- Real HTML artifacts from an agent harness
- More than two channels
- Cloudflare Pages path for this app
