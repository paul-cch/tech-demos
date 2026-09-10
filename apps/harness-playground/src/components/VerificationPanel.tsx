import type { VerificationCheck } from '../lib/types'
import { allChecksPass } from '../lib/harness'

interface Props {
  checks: VerificationCheck[]
}

function statusBadge(status: VerificationCheck['status']) {
  switch (status) {
    case 'pass':
      return 'border-emerald-500/40 bg-emerald-950/50 text-emerald-300'
    case 'fail':
      return 'border-rose-500/40 bg-rose-950/50 text-rose-300'
    default:
      return 'border-slate-600 bg-slate-900 text-slate-400'
  }
}

export function VerificationPanel({ checks }: Props) {
  const green = allChecksPass(checks)

  return (
    <section className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
          Verification
        </h2>
        <span
          className={[
            'rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase',
            green
              ? 'border-emerald-400/50 bg-emerald-950/40 text-emerald-200'
              : 'border-rose-400/40 bg-rose-950/30 text-rose-200',
          ].join(' ')}
        >
          {green ? 'all pass' : 'gates open'}
        </span>
      </header>
      <ul className="space-y-2">
        {checks.map((c) => (
          <li
            key={c.id}
            className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
          >
            <span
              className={[
                'mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                statusBadge(c.status),
              ].join(' ')}
            >
              {c.status}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-100">{c.label}</div>
              <div className="text-xs text-slate-500">{c.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
