# Television playground

A single-user channel board for the idea behind Television: an agent pins artifacts onto named channels instead of appending a chat log. From `apps/television-playground`, run `bun install` then `bun run dev`. The dev server listens on port 5173 (`strictPort` is false, so Vite will move to the next free port if 5173 is taken) at http://localhost:5173. This playground is not the real product, which needs Node 24 and an agent harness: https://github.com/telepath-computer/television.
