# ml-intern-playground — PLAN

## Goal

A single-user Bun chat inspired by Hugging Face ML Intern: plain-English ML idea → staged “intern” loop that produces paper/dataset stubs → train config → model-card artefacts — fully offline/mock (no HF token).

## Single-user MVP

**In**
- Chat input for an ML idea (one prompt at a time)
- Visible staged mock intern loop with progress: research stubs → dataset stub → train config → model card artefacts
- Artefacts panel showing generated markdown/JSON cards (content derived from the idea text)
- Clean compact Tailwind UI
- Offline only — no Hugging Face / network API calls at runtime

**Out**
- Real LLM / HF Inference / HF Hub calls
- Sandbox GPU jobs, Spaces, Trackio
- Multi-turn conversation history persistence
- Auth, accounts, billing
- Deploy wiring (Cloudflare Pages later)
- Editing artefacts beyond view/copy

## Tasks (outcome-oriented)

1. Scaffold Vite React-TS app with Bun; add bunfig.toml + Tailwind
2. Implement chat composer + mock staged intern runner (timed steps + status)
3. Generate mock paper/dataset/train-config/model-card artefacts from the idea text
4. Build artefacts panel (markdown + JSON cards, copy)
5. Verify `bun install && bun run build`; capture screenshot/video artifacts

## Stack

| Choice | Rationale |
|--------|-----------|
| Bun | Repo standard runtime / package manager / script runner |
| Vite + React + TS via `create-vite` | Official scaffold; fast SPA for a one-screen utility |
| Tailwind CSS | Same pattern as sibling demos; faster than full shadcn for a tiny MVP |
| `react-markdown` | Render model-card / paper stubs without a custom parser |
| In-app mock generator (pure TS) | Offline, deterministic stubs from idea text — no HF token |

## Deferred

- shadcn/ui polish
- Live HF Papers / Datasets / Hub integration behind a token
- Streaming token UI / real agent event stream
- Multi-session history + localStorage
- Cloudflare Pages path deploy
- Shareable deep-link for a finished run (`?idea=…`)
