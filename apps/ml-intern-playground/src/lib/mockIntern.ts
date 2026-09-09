export type StageId = 'research' | 'dataset' | 'train' | 'model_card'

export type StageStatus = 'pending' | 'running' | 'done'

export type Stage = {
  id: StageId
  label: string
  detail: string
  durationMs: number
}

export type ArtefactKind = 'markdown' | 'json'

export type Artefact = {
  id: string
  title: string
  kind: ArtefactKind
  filename: string
  body: string
  stageId: StageId
}

export type ChatMessage = {
  id: string
  role: 'user' | 'intern'
  text: string
  at: number
}

export const STAGES: Stage[] = [
  {
    id: 'research',
    label: 'Research stubs',
    detail: 'Skim papers & Hub docs for related work',
    durationMs: 900,
  },
  {
    id: 'dataset',
    label: 'Dataset stub',
    detail: 'Propose a dataset card + load recipe',
    durationMs: 750,
  },
  {
    id: 'train',
    label: 'Train config',
    detail: 'Draft trainer hyperparams & job YAML',
    durationMs: 850,
  },
  {
    id: 'model_card',
    label: 'Model card',
    detail: 'Ship model-card markdown + metadata JSON',
    durationMs: 700,
  },
]

function slugify(idea: string): string {
  const base = idea
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return base || 'ml-idea'
}

function titleCase(idea: string): string {
  const trimmed = idea.trim().replace(/\s+/g, ' ')
  if (!trimmed) return 'Untitled ML Idea'
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

function hashSeed(idea: string): number {
  let h = 2166136261
  for (let i = 0; i < idea.length; i++) {
    h ^= idea.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick<T>(seed: number, items: T[], offset = 0): T {
  return items[(seed + offset) % items.length]!
}

export function buildArtefacts(idea: string): Artefact[] {
  const title = titleCase(idea)
  const slug = slugify(idea)
  const seed = hashSeed(idea)
  const baseModel = pick(
    seed,
    [
      'google/gemma-3-1b-it',
      'meta-llama/Llama-3.2-1B-Instruct',
      'Qwen/Qwen2.5-1.5B-Instruct',
      'HuggingFaceTB/SmolLM2-360M-Instruct',
    ],
    0,
  )
  const dataset = pick(
    seed,
    [
      'HuggingFaceH4/ultrachat_200k',
      'openai/gsm8k',
      'fancyzhx/ag_news',
      'imdb',
      'squad_v2',
    ],
    1,
  )
  const method = pick(
    seed,
    ['LoRA SFT', 'QLoRA', 'GRPO', 'DPO', 'full fine-tune'],
    2,
  )
  const paper = pick(
    seed,
    [
      'LoRA: Low-Rank Adaptation of Large Language Models',
      'QLoRA: Efficient Finetuning of Quantized LLMs',
      'Direct Preference Optimization',
      'DeepSeekMath: Pushing the Limits of Mathematical Reasoning',
      'Teaching Language Models to Hallucinate Less with Semantic Entropy',
    ],
    3,
  )
  const lr = pick(seed, ['2e-4', '1e-4', '5e-5', '3e-4'], 4)
  const epochs = pick(seed, [1, 2, 3], 5)
  const rank = pick(seed, [8, 16, 32], 6)

  const researchMd = `# Research stubs — ${title}

> Offline mock from ML Intern playground. No Hub/API calls were made.

## Goal
${title}

## Related work (stub)
- **${paper}** — closest public prior art for this brief.
- HF docs skim: Transformers trainers, PEFT (\`${method}\`), Datasets streaming.
- Comparable Hub models: \`${baseModel}\` as a starting checkpoint.

## Open questions for a real intern
1. Eval set & metrics for “${slug}”
2. License / data provenance for any scraped corpus
3. Whether ${method} is enough vs. continued pretrain

## Next step
Propose a dataset stub and a minimal train config.
`

  const datasetJson = JSON.stringify(
    {
      dataset_id: `mock/${slug}-v1`,
      task: title,
      inspired_by: dataset,
      splits: { train: 0.9, validation: 0.05, test: 0.05 },
      columns: ['id', 'prompt', 'completion', 'source'],
      estimated_rows: 12_000 + (seed % 8000),
      license: 'mock-cc-by-4.0',
      load_recipe: {
        format: 'jsonl',
        streaming: true,
        text_field: 'prompt',
        label_field: 'completion',
      },
      notes:
        'Stub only — replace with a real Hub dataset id before training.',
    },
    null,
    2,
  )

  const trainJson = JSON.stringify(
    {
      job_name: `train-${slug}`,
      base_model: baseModel,
      method,
      dataset: `mock/${slug}-v1`,
      hyperparameters: {
        learning_rate: lr,
        epochs,
        per_device_train_batch_size: 4,
        gradient_accumulation_steps: 8,
        max_seq_length: 2048,
        lora_rank: method.includes('LoRA') || method === 'QLoRA' ? rank : null,
        warmup_ratio: 0.03,
        bf16: true,
      },
      hardware: {
        flavor: 'mock-a10g-small',
        estimated_hours: 2 + (seed % 5),
      },
      logging: { trackio: false, push_to_hub: false },
      notes: 'Offline mock train config — not executable.',
    },
    null,
    2,
  )

  const modelCardMd = `# Model Card — ${slug}

## Model details
- **Developed by:** ML Intern playground (mock)
- **Model type:** ${method} adapter on \`${baseModel}\`
- **Language(s):** en
- **License:** apache-2.0 (stub)

## Intended use
Prototype checkpoint for: **${title}**

## Training data
Stub dataset \`mock/${slug}-v1\` inspired by \`${dataset}\`.

## Training procedure
- Method: ${method}
- Learning rate: ${lr}
- Epochs: ${epochs}
- Hardware: mock GPU job (no real run)

## Evaluation
Not run. Suggested metrics: task-specific accuracy / win-rate vs. base.

## Limitations
This is a **mock artefact** generated offline for the tech-demos playground.
Do not deploy or cite as a real Hub model.

## Citation
\`\`\`
@misc{${slug.replace(/-/g, '_')}_mock,
  title = {${title}},
  author = {ML Intern Playground},
  year = {2026},
  note = {Offline stub}
}
\`\`\`
`

  const modelMetaJson = JSON.stringify(
    {
      model_id: `mock/${slug}`,
      base_model: baseModel,
      method,
      tags: ['mock', 'ml-intern-playground', slug.split('-')[0] ?? 'ml'],
      card: `${slug}-model-card.md`,
      created_by: 'ml-intern-playground',
      offline: true,
    },
    null,
    2,
  )

  return [
    {
      id: 'research',
      title: 'Research stubs',
      kind: 'markdown',
      filename: `${slug}-research.md`,
      body: researchMd,
      stageId: 'research',
    },
    {
      id: 'dataset',
      title: 'Dataset stub',
      kind: 'json',
      filename: `${slug}-dataset.json`,
      body: datasetJson,
      stageId: 'dataset',
    },
    {
      id: 'train',
      title: 'Train config',
      kind: 'json',
      filename: `${slug}-train.json`,
      body: trainJson,
      stageId: 'train',
    },
    {
      id: 'model_card',
      title: 'Model card',
      kind: 'markdown',
      filename: `${slug}-model-card.md`,
      body: modelCardMd,
      stageId: 'model_card',
    },
    {
      id: 'model_meta',
      title: 'Model metadata',
      kind: 'json',
      filename: `${slug}-model.json`,
      body: modelMetaJson,
      stageId: 'model_card',
    },
  ]
}

export function internStatusLine(stage: Stage, idea: string): string {
  const short =
    idea.trim().length > 64 ? `${idea.trim().slice(0, 61)}…` : idea.trim()
  switch (stage.id) {
    case 'research':
      return `Researching prior art for “${short}”…`
    case 'dataset':
      return `Drafting a dataset stub for “${short}”…`
    case 'train':
      return `Writing train config for “${short}”…`
    case 'model_card':
      return `Assembling model card artefacts for “${short}”…`
  }
}
