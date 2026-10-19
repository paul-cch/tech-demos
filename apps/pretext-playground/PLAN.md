# PLAN — pretext-playground

Followed `skills/project-planning/SKILL.md` (short form).

## Goal

Let one person see, live, that [Pretext](https://github.com/chenglou/pretext) (`@chenglou/pretext` v1.0.0) predicts multiline text height and line breaks without touching the DOM, and use its per-line API to do a layout the DOM can't.

## Single-user MVP

In:
- **Measure vs DOM tab**: textarea with presets (Latin, CJK, Arabic, Emoji mix), width slider, font family / weight / size / line height, `pre-wrap` toggle. Pretext's `layoutWithLines()` result next to a real DOM paint at the same width; match indicator with height diff (px), line counts, `prepare()` / `layout()` timings; a sweep (120–600px every 8px) that counts height and line-break agreement and lists the widths that differ.
- **Canvas flow tab**: text laid out row by row with `layoutNextLineRange()` + `materializeLineRange()` around a draggable circle/square, painted with `fillText`.

Out: rich inline (`@chenglou/pretext/rich-inline`), SVG output, virtualization demo, deploy, persistence, tests beyond `bun run build`.

## Tasks (vertical slices)

1. Scaffold (`bun create vite` react-ts), `bunfig.toml` with `minimumReleaseAge = 259200`, bundled fonts.
2. Measure tab: prepare → layout → DOM ground truth (grapheme client rects) → match indicator → sweep.
3. Flow tab: slot computation per row, cursor-driven line streaming, pointer drag.
4. Screenshots + video under `docs/`, README, PR.

## Stack

- **Bun + Vite + React + TypeScript** — repo default; `bun install && bun run dev`.
- **@chenglou/pretext 1.0.0** — the subject.
- **Bundled fonts** (Inter Variable, Noto Sans SC, Noto Sans Arabic via @fontsource; Noto Color Emoji COLRv1 self-hosted in `public/fonts/`) — Pretext needs named fonts and the same faces on every machine. The @fontsource emoji package is the OT-SVG build, which Chromium paints blank, so emoji come from the Google Fonts COLRv1 build instead (Apple Color Emoji first on macOS).
- **Plain CSS, no shadcn/Tailwind** — two screens of custom controls and measurement panes; a component kit would add more wiring than it removes. Deliberate deviation from the skill's shadcn default.

## Deferred

- Rich-inline mentions/chips demo — separate API surface, not needed to show the core idea.
- Unit tests — the app's own sweep is the verification; nothing critical to unit-test.
- Cloudflare Pages deploy — not wired in this repo yet.
