# apps/

One demo app per kebab-case folder: `apps/<slug>/`.

Each app should be independently runnable:

```bash
cd apps/<slug>
bun install
bun run dev
```

Do not put shared app code at the monorepo root unless a future task explicitly asks for it.
