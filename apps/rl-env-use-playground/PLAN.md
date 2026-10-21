# rl-env-use Playground: plan

**Goal:** let one person feel what browser-use/rl-env-use's shipped `trial-forecast` env measures. Forecast the real tasks yourself, get scored with the env's reward, and step through the prompt hillclimb that moved Qwen 3.6 35B from 0.53 to 0.78.

## MVP (single user, no keys, no backend)
- **Forecast tab:** the 35 tasks the env serves today (repo `keep()` + `balanced()` filters), held-out test first. Protocol text, a probability slider, and a lock-in step that reveals the gold, your 1 − Brier score, and every stored rep from base Qwen, climbed Qwen, Opus 5.5 and GPT-6 Astra. Running scoreboard against always-50%. Reliability-bin calibration chart. Answers persist in localStorage.
- **Hillclimb tab:** `_state.json` verbatim. Four rounds × three candidate edits, the proposer's failure buckets, train-screen and test paired CIs, keep/revert, the incumbent score trajectory, and a prompt diff per variant. The final result is regraded on the 16 test tasks served today with the repo's own `audit.paired`.

**Out of scope:** live env creation (needs Browser Use + OpenRouter keys; README note only), running models in the browser, the other shipped envs (sec-credit, web-agent-benchmarks), per-rep reasoning traces (not shipped).

## Tasks (vertical slices)
1. `scripts/extract.py`: import the repo's own filters, grader and bootstrap, then write `src/data/{tasks,meta,hillclimb}.json`.
2. Forecast tab: task card, slider, reveal table, scoreboard, calibration SVG.
3. Hillclimb tab: summary cards, trajectory, round cards with CI bars, prompt diff.
4. README, screenshots, video, PR.

## Stack
- Bun + Vite + React + TS (`bun create vite`, react-ts): a two-tab static app needs no framework.
- Plain CSS following the pretext-playground light theme. No shadcn: three widgets don't justify the setup.
- Hand-rolled SVG chart (one reliability diagram) instead of a chart lib.
- Python only for the one-off vendoring script, run against a clone with the package installed so numbers come from upstream code.

## Testing
- `bun run build` (tsc + vite) as the gate. The extraction script asserts parity by reproducing README/stats.json numbers (0.532 → 0.777, +0.245 [+0.066, +0.451]).

## Deferred
- Live `rl-env-use create` / `climb` via a local Python sidecar (needs keys and spend).
- Per-category breakdowns and a Brier decomposition (resolution vs calibration).
