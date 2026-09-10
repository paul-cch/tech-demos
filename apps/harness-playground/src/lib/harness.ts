import type { Fixture, LoopEvent, Phase, VerificationCheck } from './types'

export interface HarnessState {
  fixture: Fixture
  phase: Phase
  stepIndex: number
  events: LoopEvent[]
  running: boolean
  files: Fixture['files']
  checks: VerificationCheck[]
}

export function initialState(fixture: Fixture): HarnessState {
  return {
    fixture,
    phase: 'idle',
    stepIndex: -1,
    events: [],
    running: false,
    files: structuredClone(fixture.files),
    checks: structuredClone(fixture.checks),
  }
}

export function applyStep(state: HarnessState, stepIndex: number): HarnessState {
  const step = state.fixture.steps[stepIndex]
  if (!step) {
    return { ...state, phase: 'done', running: false, stepIndex }
  }

  const files = structuredClone(state.files)
  for (const update of step.fileUpdates ?? []) {
    const idx = files.findIndex((f) => f.path === update.path)
    if (idx >= 0) {
      files[idx] = {
        ...files[idx],
        content: update.content,
        missing: update.missing ?? false,
        lintIssues: update.lintIssues ?? files[idx].lintIssues,
      }
    } else {
      files.push({
        path: update.path,
        content: update.content,
        missing: update.missing,
        lintIssues: update.lintIssues,
      })
    }
  }

  const checks = structuredClone(state.checks)
  for (const id of step.passChecks ?? []) {
    const c = checks.find((x) => x.id === id)
    if (c) c.status = 'pass'
  }
  for (const id of step.failChecks ?? []) {
    const c = checks.find((x) => x.id === id)
    if (c) c.status = 'fail'
  }

  const event: LoopEvent = {
    index: stepIndex,
    phase: step.phase,
    title: step.title,
    detail: step.detail,
    at: Date.now(),
  }

  const isLast = stepIndex >= state.fixture.steps.length - 1

  return {
    ...state,
    phase: isLast ? 'done' : step.phase,
    stepIndex,
    events: [...state.events, event],
    files,
    checks,
    running: !isLast,
  }
}

export function allChecksPass(checks: VerificationCheck[]): boolean {
  return checks.length > 0 && checks.every((c) => c.status === 'pass')
}
