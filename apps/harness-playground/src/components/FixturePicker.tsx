import { FIXTURES } from '../lib/fixtures'

interface Props {
  selectedId: string
  disabled?: boolean
  onSelect: (id: string) => void
}

export function FixturePicker({ selectedId, disabled, onSelect }: Props) {
  return (
    <section className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-4">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
          Environment fixture
        </h2>
        <span className="text-xs text-slate-500">seed / select</span>
      </header>
      <div className="grid gap-2 sm:grid-cols-3">
        {FIXTURES.map((f) => {
          const active = f.id === selectedId
          return (
            <button
              key={f.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(f.id)}
              className={[
                'rounded-lg border px-3 py-3 text-left transition',
                active
                  ? 'border-cyan-400/70 bg-cyan-950/50 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
                  : 'border-slate-700 bg-slate-950/40 hover:border-slate-500',
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
              ].join(' ')}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-cyan-300 uppercase">
                  {f.tag}
                </span>
                {active && (
                  <span className="text-[10px] font-medium text-cyan-400">selected</span>
                )}
              </div>
              <div className="text-sm font-medium text-slate-100">{f.name}</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{f.summary}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
