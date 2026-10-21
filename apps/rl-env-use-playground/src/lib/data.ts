import tasksJson from '../data/tasks.json'
import metaJson from '../data/meta.json'
import hillJson from '../data/hillclimb.json'

export type ModelKey = 'qwenBase' | 'qwenTuned' | 'opus' | 'gptAstra'
export type Run = { rep: number; answer: string | null; p: number | null; score: number }
export type Task = {
  id: string
  case: string
  split: 'train' | 'test'
  category: string
  difficulty: string
  prompt: string
  context: string
  gold: 'yes' | 'no'
  whyHard: string
  evidence: { url: string; quote: string }[]
  models: Record<ModelKey, Run[]>
}
export type Paired = { n: number; cases: number; diff: number; lo: number; hi: number; p_better: number }
export type Round = {
  round: number
  candidates: { variant: string; change: string; train_screen: Paired }[]
  buckets: { name: string; task_ids: string[]; fixable: boolean }[]
  variant: string
  change: string
  train: Paired
  test: Paired
  decision: string
  test_now: number
}

export const tasks = tasksJson as Task[]
export const meta = metaJson
export const hill = hillJson as unknown as {
  policy: string
  proposer: string
  reps: number
  confidence: number
  usd: number
  baseline: { train: number; test: number; noise: number; mde: number; mixed_train: number }
  final: { variant: string; test: Paired; baseline_test: number; best_test: number; reps: number; test_looks: number; decision: string }
  rounds: Round[]
  incumbent: string
  caseSys: string
  variants: Record<string, { prompt: string; change: string }>
  nTrainAtClimb: number
  nTestAtClimb: number
}

export const MODELS: { key: ModelKey; label: string; short: string; color: string }[] = [
  { key: 'qwenBase', label: 'Qwen 3.6 35B · base prompt', short: 'Qwen base', color: '#f97316' },
  { key: 'qwenTuned', label: 'Qwen 3.6 35B · climbed prompt', short: 'Qwen climbed', color: '#4f46e5' },
  { key: 'opus', label: 'Claude Opus 5.5', short: 'Opus 5.5', color: '#a16207' },
  { key: 'gptAstra', label: 'GPT-6 Astra', short: 'GPT-6 Astra', color: '#0f766e' },
]

export const CATEGORY_LABEL: Record<string, string> = {
  endpoint_outcome: 'Primary outcome direction',
  completion_rate: 'Completion ≥ 80%',
  statistical_significance: 'p < 0.05',
  primary_outcome_p_value: 'p < 0.05',
}

/** rl_env_use/graders.py prob_score: 1 − Brier, gold yes → 1, no → 0. */
export const probScore = (p: number, gold: 'yes' | 'no') => 1 - (p - (gold === 'yes' ? 1 : 0)) ** 2

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)

/** Per-task model score = mean over its reps (rl_env_use/audit.py case_means). */
export const taskScore = (t: Task, k: ModelKey) => mean(t.models[k].map((r) => r.score))

export const fmt = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '—')
export const signed = (x: number, d = 3) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d)
