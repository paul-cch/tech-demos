import type { EnvFile } from '../lib/types'

interface Props {
  files: EnvFile[]
  goal: string
  selectedPath: string | null
  onSelectPath: (path: string) => void
}

export function EnvironmentView({ files, goal, selectedPath, onSelectPath }: Props) {
  const current = files.find((f) => f.path === selectedPath) ?? files[0]

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-700/80 bg-slate-900/70">
      <header className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
          Workspace
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          <span className="text-slate-500">Goal:</span> {goal}
        </p>
      </header>
      <div className="grid min-h-0 flex-1 md:grid-cols-[11rem_1fr]">
        <ul className="border-b border-slate-800 p-2 md:border-r md:border-b-0">
          {files.map((f) => {
            const active = f.path === current?.path
            return (
              <li key={f.path}>
                <button
                  type="button"
                  onClick={() => onSelectPath(f.path)}
                  className={[
                    'mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs',
                    active ? 'bg-slate-800 text-cyan-200' : 'text-slate-400 hover:bg-slate-800/60',
                  ].join(' ')}
                >
                  <span className="truncate font-mono">{f.path}</span>
                  {f.missing && (
                    <span className="ml-auto shrink-0 rounded bg-rose-950 px-1 text-[9px] text-rose-300">
                      missing
                    </span>
                  )}
                  {(f.lintIssues ?? 0) > 0 && (
                    <span className="ml-auto shrink-0 rounded bg-amber-950 px-1 text-[9px] text-amber-300">
                      {f.lintIssues} lint
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        <pre className="overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300">
          {current?.missing ? (
            <span className="text-rose-300 italic">// file missing from workspace</span>
          ) : (
            current?.content || '// empty'
          )}
        </pre>
      </div>
    </section>
  )
}
