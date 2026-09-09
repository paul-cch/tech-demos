import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  STAGES,
  buildArtefacts,
  internStatusLine,
  type Artefact,
  type ChatMessage,
  type StageId,
  type StageStatus,
} from './lib/mockIntern'

type StageState = Record<StageId, StageStatus>

const INITIAL_STAGES: StageState = {
  research: 'pending',
  dataset: 'pending',
  train: 'pending',
  model_card: 'pending',
}

const EXAMPLES = [
  'Fine-tune a small LM for SQL generation from natural language',
  'Classify support tickets into billing / bug / feature with LoRA',
  'GRPO a 1B model on GSM8K-style math reasoning',
]

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export default function App() {
  const [idea, setIdea] = useState('')
  const [running, setRunning] = useState(false)
  const [stages, setStages] = useState<StageState>(INITIAL_STAGES)
  const [activeStage, setActiveStage] = useState<StageId | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'intern',
      text: 'Describe an ML idea in plain English. I will run a mock intern loop: research → dataset → train config → model card. Offline only — no HF token needed.',
      at: Date.now(),
    },
  ])
  const [artefacts, setArtefacts] = useState<Artefact[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview')
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const cancelRef = useRef(false)

  const selected = useMemo(
    () => artefacts.find((a) => a.id === selectedId) ?? artefacts[0],
    [artefacts, selectedId],
  )

  const doneCount = STAGES.filter((s) => stages[s.id] === 'done').length
  const progressPct = Math.round((doneCount / STAGES.length) * 100)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, running, activeStage])

  const pushMessage = useCallback((role: ChatMessage['role'], text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: uid(role), role, text, at: Date.now() },
    ])
  }, [])

  const resetRun = useCallback(() => {
    setStages(INITIAL_STAGES)
    setActiveStage(null)
    setArtefacts([])
    setSelectedId(null)
    setViewMode('preview')
  }, [])

  const runIntern = useCallback(
    async (rawIdea: string) => {
      const trimmed = rawIdea.trim()
      if (!trimmed || running) return

      cancelRef.current = false
      setRunning(true)
      resetRun()
      setIdea('')
      pushMessage('user', trimmed)
      pushMessage(
        'intern',
        `Got it. Starting mock intern loop for “${trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed}”.`,
      )

      const planned = buildArtefacts(trimmed)
      const unlocked: Artefact[] = []

      for (const stage of STAGES) {
        if (cancelRef.current) break
        setActiveStage(stage.id)
        setStages((prev) => ({ ...prev, [stage.id]: 'running' }))
        pushMessage('intern', internStatusLine(stage, trimmed))

        await new Promise((r) => window.setTimeout(r, stage.durationMs))
        if (cancelRef.current) break

        const stageArts = planned.filter((a) => a.stageId === stage.id)
        unlocked.push(...stageArts)
        setArtefacts([...unlocked])
        setSelectedId(stageArts[0]?.id ?? unlocked[unlocked.length - 1]?.id ?? null)
        setStages((prev) => ({ ...prev, [stage.id]: 'done' }))
        pushMessage(
          'intern',
          `✓ ${stage.label} ready (${stageArts.map((a) => a.filename).join(', ')}).`,
        )
      }

      if (!cancelRef.current) {
        setActiveStage(null)
        pushMessage(
          'intern',
          'Loop complete. Browse artefacts on the right — markdown & JSON stubs derived from your idea. (Mock only; no Hub upload.)',
        )
      }
      setRunning(false)
    },
    [pushMessage, resetRun, running],
  )

  async function copySelected() {
    if (!selected) return
    try {
      await navigator.clipboard.writeText(selected.body)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    void runIntern(idea)
  }

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <header className="border-b border-white/10 bg-[#0d1428]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-sky-300/80">
              tech-demos · offline mock
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              ML Intern playground
            </h1>
          </div>
          <p className="max-w-lg text-right text-xs leading-relaxed text-slate-400">
            Plain-English ML idea → staged intern loop → paper/dataset/train/model-card
            stubs. Inspired by Hugging Face ml-intern — no token required.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
        {/* Left: chat + stages */}
        <section className="flex min-h-[32rem] flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-[#121a31]/90 p-3 shadow-xl shadow-black/30">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-white">Intern loop</h2>
              <span className="text-[11px] tabular-nums text-slate-400">
                {progressPct}% · {doneCount}/{STAGES.length} stages
              </span>
            </div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-sky-400/80 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <ol className="grid gap-2 sm:grid-cols-2">
              {STAGES.map((stage, i) => {
                const status = stages[stage.id]
                const isActive = activeStage === stage.id
                return (
                  <li
                    key={stage.id}
                    className={[
                      'rounded-lg border px-3 py-2 transition',
                      status === 'done'
                        ? 'border-emerald-400/30 bg-emerald-500/10'
                        : isActive
                          ? 'border-sky-400/40 bg-sky-500/15 ring-1 ring-sky-400/30'
                          : 'border-white/10 bg-[#0b1020]/60',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                          status === 'done'
                            ? 'bg-emerald-400/20 text-emerald-300'
                            : isActive
                              ? 'bg-sky-400/25 text-sky-200'
                              : 'bg-white/5 text-slate-500',
                        ].join(' ')}
                      >
                        {status === 'done' ? '✓' : i + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-100">
                        {stage.label}
                      </span>
                      {isActive && (
                        <span className="ml-auto animate-pulse text-[10px] uppercase tracking-wide text-sky-300">
                          running
                        </span>
                      )}
                      {status === 'done' && !isActive && (
                        <span className="ml-auto text-[10px] uppercase tracking-wide text-emerald-300/90">
                          done
                        </span>
                      )}
                    </div>
                    <p className="mt-1 pl-7 text-[11px] leading-snug text-slate-400">
                      {stage.detail}
                    </p>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/10 bg-[#121a31]/90 shadow-xl shadow-black/30">
            <div className="border-b border-white/10 px-3 py-2">
              <h2 className="text-sm font-medium text-white">Chat</h2>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={[
                    'max-w-[92%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'ml-auto bg-sky-500/20 text-sky-50'
                      : 'mr-auto bg-white/5 text-slate-200',
                  ].join(' ')}
                >
                  <p className="mb-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                    {m.role === 'user' ? 'you' : 'ml-intern'}
                  </p>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={onSubmit}
              className="border-t border-white/10 p-3"
            >
              <label className="sr-only" htmlFor="ml-idea">
                ML idea
              </label>
              <textarea
                id="ml-idea"
                rows={2}
                value={idea}
                disabled={running}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void runIntern(idea)
                  }
                }}
                placeholder="e.g. Fine-tune a small LM for SQL generation…"
                className="w-full resize-none rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm text-slate-100 outline-none ring-sky-400/40 placeholder:text-slate-500 focus:ring-2 disabled:opacity-60"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={running || !idea.trim()}
                  className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {running ? 'Running…' : 'Run intern'}
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      disabled={running}
                      onClick={() => setIdea(ex)}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300 transition hover:border-sky-400/30 hover:text-sky-200 disabled:opacity-40"
                    >
                      {ex.length > 42 ? `${ex.slice(0, 40)}…` : ex}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* Right: artefacts */}
        <section className="flex min-h-[32rem] flex-col rounded-xl border border-white/10 bg-[#121a31]/90 shadow-xl shadow-black/30">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
            <h2 className="text-sm font-medium text-white">Artefacts</h2>
            <span className="text-[11px] text-slate-500">
              {artefacts.length === 0
                ? 'waiting for run'
                : `${artefacts.length} files`}
            </span>
          </div>

          {artefacts.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-sm text-slate-400">
                Artefacts appear as each intern stage completes.
              </p>
              <p className="text-xs text-slate-500">
                Research markdown → dataset JSON → train config → model card.
              </p>
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]">
              <ul className="flex gap-1.5 overflow-x-auto border-b border-white/10 px-2 py-2">
                {artefacts.map((a) => {
                  const active = a.id === selected?.id
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(a.id)
                          setViewMode('preview')
                        }}
                        className={[
                          'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-xs transition',
                          active
                            ? 'bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/40'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10',
                        ].join(' ')}
                      >
                        <span className="font-medium">{a.title}</span>
                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          {a.filename}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {selected && (
                <div className="flex min-h-0 flex-col">
                  <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
                    <p className="mr-auto truncate font-mono text-[11px] text-slate-400">
                      {selected.filename}
                    </p>
                    <div className="flex rounded-lg border border-white/10 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setViewMode('preview')}
                        className={[
                          'rounded-md px-2 py-1',
                          viewMode === 'preview'
                            ? 'bg-white/10 text-white'
                            : 'text-slate-400',
                        ].join(' ')}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('raw')}
                        className={[
                          'rounded-md px-2 py-1',
                          viewMode === 'raw'
                            ? 'bg-white/10 text-white'
                            : 'text-slate-400',
                        ].join(' ')}
                      >
                        Raw
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copySelected()}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-white/10"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                    {viewMode === 'raw' || selected.kind === 'json' ? (
                      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#0b1020] p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                        {selected.body}
                      </pre>
                    ) : (
                      <div className="prose-artefact text-sm text-slate-200">
                        <ReactMarkdown>{selected.body}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-6 text-center text-[11px] text-slate-600">
        Mock playground for bookmark 2097359184207511654 · no Hugging Face API
        calls
      </footer>
    </div>
  )
}
