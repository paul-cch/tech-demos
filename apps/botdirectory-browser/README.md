# botdirectory-browser

Tiny offline browser for agent-bot prompt markdowns (botdirectory.ai-style).

Browse/search a handful of vendored sample bots, preview the prompt, one-click copy.

## Run

```bash
cd apps/botdirectory-browser
bun install
bun run dev
```

Build:

```bash
bun run build
```

## Notes

- Samples live under `src/bots/*.md` and are bundled at build time (`?raw` imports).
- No runtime network to botdirectory.ai.
- See `PLAN.md` for MVP scope and deferred items.
