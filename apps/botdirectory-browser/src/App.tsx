import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { bots, filterBots, type Bot } from './bots/catalog'

type ViewMode = 'preview' | 'raw'

export default function App() {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(bots[0]?.id ?? '')
  const [mode, setMode] = useState<ViewMode>('preview')
  const [copied, setCopied] = useState(false)

  const filtered = useMemo(() => filterBots(query), [query])
  const selected: Bot | undefined =
    filtered.find((b) => b.id === selectedId) ?? filtered[0] ?? bots[0]

  async function copyPrompt() {
    if (!selected) return
    try {
      await navigator.clipboard.writeText(selected.prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <header className="border-b border-white/10 bg-[#0d1428]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-sky-300/80">
              tech-demos · offline
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              botdirectory browser
            </h1>
          </div>
          <p className="max-w-md text-right text-xs leading-relaxed text-slate-400">
            Browse sample agent-bot prompts. Search, preview, copy — no network
            required.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="flex min-h-[28rem] flex-col rounded-xl border border-white/10 bg-[#121a31]/90 shadow-xl shadow-black/30">
          <div className="border-b border-white/10 p-3">
            <label className="sr-only" htmlFor="bot-search">
              Search bots
            </label>
            <input
              id="bot-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or tags…"
              className="w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm text-slate-100 outline-none ring-sky-400/40 placeholder:text-slate-500 focus:ring-2"
            />
            <p className="mt-2 text-[11px] text-slate-500">
              {filtered.length} of {bots.length} bots
            </p>
          </div>

          <ul className="flex-1 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <li className="px-2 py-6 text-center text-sm text-slate-500">
                No bots match “{query}”.
              </li>
            )}
            {filtered.map((bot) => {
              const active = bot.id === selected?.id
              return (
                <li key={bot.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(bot.id)
                      setMode('preview')
                    }}
                    className={[
                      'mb-1 w-full rounded-lg px-3 py-2.5 text-left transition',
                      active
                        ? 'bg-sky-500/20 ring-1 ring-sky-400/40'
                        : 'hover:bg-white/5',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white">
                        {bot.name}
                      </span>
                      {active && (
                        <span className="text-[10px] uppercase tracking-wide text-sky-300">
                          open
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                      {bot.description}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {bot.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <section className="flex min-h-[28rem] flex-col rounded-xl border border-white/10 bg-[#121a31]/90 shadow-xl shadow-black/30">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {selected.name}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-slate-400">
                    {selected.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-lg border border-white/10 bg-[#0b1020] p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setMode('preview')}
                      className={[
                        'rounded-md px-2.5 py-1.5',
                        mode === 'preview'
                          ? 'bg-white/10 text-white'
                          : 'text-slate-400 hover:text-slate-200',
                      ].join(' ')}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('raw')}
                      className={[
                        'rounded-md px-2.5 py-1.5',
                        mode === 'raw'
                          ? 'bg-white/10 text-white'
                          : 'text-slate-400 hover:text-slate-200',
                      ].join(' ')}
                    >
                      Raw
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={copyPrompt}
                    className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 shadow hover:bg-sky-400 active:scale-[0.98]"
                  >
                    {copied ? 'Copied ✓' : 'Copy prompt'}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {mode === 'preview' ? (
                  <article className="prose-bot max-w-none text-sm text-slate-200">
                    <ReactMarkdown>{selected.prompt}</ReactMarkdown>
                  </article>
                ) : (
                  <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-[#0b1020] p-4 font-mono text-xs leading-relaxed text-slate-300">
                    {selected.prompt}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
              Select a bot to preview its prompt.
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-6 text-[11px] text-slate-500">
        Inspired by{' '}
        <a
          className="text-sky-400/90 underline-offset-2 hover:underline"
          href="https://github.com/elie222/botdirectory.ai"
          target="_blank"
          rel="noreferrer"
        >
          botdirectory.ai
        </a>
        . Samples are offline vendored demos — not fetched at runtime.
      </footer>
    </div>
  )
}
