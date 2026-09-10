import type { LoopEvent, Phase } from '../lib/types'

interface Props {
  phase: Phase
  events: LoopEvent[]
  stepIndex: number
  totalSteps: number
}

const PHASE_ORDER: Array<Exclude<Phase, 'idle' | 'done'>> = ['plan', 'act', 'observe']

function phaseTone(phase: Phase): string {
  switch (phase) {
    case 'plan':
      return 'border-violet-400/50 bg-violet-950/40 text-violet-200'
    case 'act':
      return 'border-amber-400/50 bg-amber-950/40 text-amber-200'
    case 'observe':
      return 'border-emerald-400/50 bg-emerald-950/40 text-emerald-200'
    case 'done':
      return 'border-cyan-400/50 bg-cyan-950/40 text-cyan-200'
    default:
      return 'border-slate-600 bg-slate-900 text-slate-400'
  }
}

export function AgentLoop({ phase, events, stepIndex, totalSteps }: Props) {
  return (
    <section className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
          Mock agent loop
        </h2>
        <div className="flex items-center gap-2">
          {PHASE_ORDER.map((p) => (
            <span
              key={p}
              className={[
                'rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase',
                phase === p || (phase === 'done' && p === 'observe')
                  ? phaseTone(p)
                  : 'border-slate-700 text-slate-600',
              ].join(' ')}
            >
              {p}
            </span>
          ))}
          <span className="ml-1 text-xs text-slate-500">
            {Math.max(0, stepIndex + 1)}/{totalSteps}
          </span>
        </div>
      </header>

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 px-3 py-6 text-center text-sm text-slate-500">
          Press <span className="text-slate-300">Run harness</span> to walk plan → act → observe.
        </p>
      ) : (
        <ol className="space-y-2">
          {events.map((e) => (
            <li
              key={`${e.index}-${e.title}`}
              className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2"
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={[
                    'rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase',
                    phaseTone(e.phase),
                  ].join(' ')}
                >
                  {e.phase}
                </span>
                <span className="text-sm font-medium text-slate-100">{e.title}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{e.detail}</p>
            </li>
          ))}
        </ol>
      )}

      {phase === 'done' && (
        <p className="mt-3 rounded-md border border-cyan-800/60 bg-cyan-950/30 px-3 py-2 text-xs text-cyan-200">
          Loop complete — verification should now be fully green.
        </p>
      )}
    </section>
  )
}
