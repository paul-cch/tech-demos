# ml-intern-playground

Offline Bun chat inspired by [Hugging Face ML Intern](https://github.com/huggingface/ml-intern): plain-English ML idea → staged mock intern loop → paper/dataset/train/model-card artefacts.

## Run

```bash
cd apps/ml-intern-playground
bun install
bun run dev
```

Build:

```bash
bun run build
```

## Notes

- Fully offline — no HF token or network calls at runtime.
- Artefact bodies are derived deterministically from the idea text.
- See `PLAN.md` for MVP scope and deferred items.
