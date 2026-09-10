import { useCallback, useEffect, useRef, useState } from 'react'
import { AgentLoop } from './components/AgentLoop'
import { EnvironmentView } from './components/EnvironmentView'
import { FixturePicker } from './components/FixturePicker'
import { VerificationPanel } from './components/VerificationPanel'
import { cloneFixture } from './lib/fixtures'
import { applyStep, initialState, type HarnessState } from './lib/harness'

const STEP_MS = 900

export default function App() {
  const [fixtureId, setFixtureId] = useState('broken-test')
  const [state, setState] = useState<HarnessState>(() =>
    initialState(cloneFixture('broken-test')),
  )
  const [selectedPath, setSelectedPath] = useState<string | null>(
    cloneFixture('broken-test').files[0]?.path ?? null,
  )
  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const resetTo = useCallback((id: string) => {
    clearTimer()
    const fixture = cloneFixture(id)
    setFixtureId(id)
    setState(initialState(fixture))
    setSelectedPath(fixture.files[0]?.path ?? null)
  }, [])

  const runLoop = useCallback(() => {
    clearTimer()
    const fixture = cloneFixture(fixtureId)
    let next: HarnessState = {
      ...initialState(fixture),
      running: true,
      phase: 'plan',
    }
    setState(next)
    setSelectedPath(fixture.files[0]?.path ?? null)

    let i = 0
    const tick = () => {
      next = applyStep(next, i)
      setState({ ...next })
      const updated = next.fixture.steps[i]?.fileUpdates?.[0]?.path
      if (updated) setSelectedPath(updated)
      i += 1
      if (i < fixture.steps.length) {
        timerRef.current = window.setTimeout(tick, STEP_MS)
      }
    }
    timerRef.current = window.setTimeout(tick, 350)
  }, [fixtureId])

  useEffect(() => () => clearTimer(), [])

  const busy = state.running

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-cyan-400/90 uppercase">
              learn-harness-engineering · offline MVP
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Harness Playground
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Seed a broken environment, watch a mock coding agent walk{' '}
              <span className="text-slate-200">plan → act → observe</span>, and see verification
              gates flip from fail to pass — no network, no real LLM.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => resetTo(fixtureId)}
              disabled={busy}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-slate-400 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={runLoop}
              disabled={busy}
              className="rounded-lg border border-cyan-400/60 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {busy ? 'Running…' : 'Run harness'}
            </button>
          </div>
        </header>

        <FixturePicker
          selectedId={fixtureId}
          disabled={busy}
          onSelect={(id) => resetTo(id)}
        />

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <EnvironmentView
            files={state.files}
            goal={state.fixture.goal}
            selectedPath={selectedPath}
            onSelectPath={setSelectedPath}
          />
          <div className="flex flex-col gap-4">
            <AgentLoop
              phase={state.phase}
              events={state.events}
              stepIndex={state.stepIndex}
              totalSteps={state.fixture.steps.length}
            />
            <VerificationPanel checks={state.checks} />
          </div>
        </div>

        <footer className="border-t border-slate-800 pt-3 text-xs text-slate-600">
          Inspired by{' '}
          <a
            className="text-slate-400 underline-offset-2 hover:text-cyan-300 hover:underline"
            href="https://github.com/walkinglabs/learn-harness-engineering"
            target="_blank"
            rel="noreferrer"
          >
            walkinglabs/learn-harness-engineering
          </a>
          . Self-contained Bun + Vite + React demo.
        </footer>
      </div>
    </div>
  )
}
