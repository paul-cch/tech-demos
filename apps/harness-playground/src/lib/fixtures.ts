import type { Fixture } from './types'

export const FIXTURES: Fixture[] = [
  {
    id: 'broken-test',
    name: 'Broken unit test',
    summary: 'sum() returns wrong value; test suite red.',
    tag: 'tests',
    goal: 'Make `bun test` green by fixing src/math.ts.',
    files: [
      {
        path: 'src/math.ts',
        content: `export function sum(a: number, b: number) {\n  return a - b // bug: should add\n}\n`,
      },
      {
        path: 'src/math.test.ts',
        content: `import { expect, test } from "bun:test"\nimport { sum } from "./math"\n\ntest("sum adds", () => {\n  expect(sum(2, 3)).toBe(5)\n})\n`,
      },
      {
        path: 'AGENTS.md',
        content: `# Agents\n\n1. Read failing tests first.\n2. Fix the smallest surface.\n3. Re-run verification before claiming done.\n`,
      },
    ],
    checks: [
      {
        id: 'test-suite',
        label: 'Unit tests',
        detail: 'bun test → expect green',
        status: 'fail',
      },
      {
        id: 'math-impl',
        label: 'sum() correctness',
        detail: 'sum(2,3) === 5',
        status: 'fail',
      },
      {
        id: 'agents-read',
        label: 'Harness read',
        detail: 'AGENTS.md consulted before edits',
        status: 'pending',
      },
    ],
    steps: [
      {
        phase: 'plan',
        title: 'Read harness + failing test',
        detail: 'Opened AGENTS.md and math.test.ts. Goal: make sum(2,3) return 5.',
        passChecks: ['agents-read'],
      },
      {
        phase: 'act',
        title: 'Patch sum()',
        detail: 'Changed `a - b` → `a + b` in src/math.ts.',
        fileUpdates: [
          {
            path: 'src/math.ts',
            content: `export function sum(a: number, b: number) {\n  return a + b\n}\n`,
          },
        ],
        passChecks: ['math-impl'],
      },
      {
        phase: 'observe',
        title: 'Re-run bun test',
        detail: 'Observed: 1 pass, 0 fail. Verification gate clears.',
        passChecks: ['test-suite'],
      },
    ],
  },
  {
    id: 'missing-file',
    name: 'Missing config file',
    summary: 'feature_list.json absent; agent has no task tracker.',
    tag: 'env',
    goal: 'Restore feature_list.json so the harness can track work.',
    files: [
      {
        path: 'feature_list.json',
        content: '',
        missing: true,
      },
      {
        path: 'AGENTS.md',
        content: `# Agents\n\nBefore coding, ensure feature_list.json exists and mark one feature in_progress.\n`,
      },
      {
        path: 'src/app.ts',
        content: `export const ready = false\n`,
      },
    ],
    checks: [
      {
        id: 'feature-list',
        label: 'feature_list.json present',
        detail: 'Required harness tracker file',
        status: 'fail',
      },
      {
        id: 'one-in-progress',
        label: 'Exactly one in_progress',
        detail: 'Scope control for the session',
        status: 'fail',
      },
      {
        id: 'init-ok',
        label: 'init health',
        detail: 'Environment seed passes',
        status: 'pending',
      },
    ],
    steps: [
      {
        phase: 'plan',
        title: 'Diagnose missing tracker',
        detail: 'init.sh reported: feature_list.json not found. Plan: recreate minimal tracker.',
        passChecks: ['init-ok'],
      },
      {
        phase: 'act',
        title: 'Write feature_list.json',
        detail: 'Seeded one pending feature and flipped it to in_progress.',
        fileUpdates: [
          {
            path: 'feature_list.json',
            missing: false,
            content: `{\n  "features": [\n    {\n      "id": "F1",\n      "title": "Wire health endpoint",\n      "status": "in_progress",\n      "verify": ["curl /health → 200"]\n    }\n  ]\n}\n`,
          },
        ],
        passChecks: ['feature-list'],
      },
      {
        phase: 'observe',
        title: 'Validate tracker shape',
        detail: 'Counted statuses: 1 in_progress, 0 done. Scope gate passes.',
        passChecks: ['one-in-progress'],
      },
    ],
  },
  {
    id: 'lint-fail',
    name: 'Lint failure',
    summary: 'Unused import + any type; oxlint exits non-zero.',
    tag: 'lint',
    goal: 'Clear lint so the verification pipeline is green.',
    files: [
      {
        path: 'src/handler.ts',
        content: `import { unused } from "./ghost"\n\nexport function handle(input: any) {\n  return String(input)\n}\n`,
        lintIssues: 2,
      },
      {
        path: 'src/ghost.ts',
        content: `export const unused = true\n`,
      },
      {
        path: 'AGENTS.md',
        content: `# Agents\n\nNever skip lint. Fix diagnostics before marking a feature done.\n`,
      },
    ],
    checks: [
      {
        id: 'oxlint',
        label: 'oxlint clean',
        detail: 'bun run lint → exit 0',
        status: 'fail',
      },
      {
        id: 'no-any',
        label: 'No implicit any',
        detail: 'handler input typed',
        status: 'fail',
      },
      {
        id: 'no-unused',
        label: 'No unused imports',
        detail: 'Remove dead import',
        status: 'fail',
      },
    ],
    steps: [
      {
        phase: 'plan',
        title: 'Collect lint diagnostics',
        detail: 'oxlint: unused import `unused`; unexpected any on handle().',
      },
      {
        phase: 'act',
        title: 'Fix handler.ts',
        detail: 'Dropped unused import; typed input as unknown.',
        fileUpdates: [
          {
            path: 'src/handler.ts',
            lintIssues: 0,
            content: `export function handle(input: unknown) {\n  return String(input)\n}\n`,
          },
        ],
        passChecks: ['no-any', 'no-unused'],
      },
      {
        phase: 'observe',
        title: 'Re-run oxlint',
        detail: '0 warnings, 0 errors. Lint gate passes.',
        passChecks: ['oxlint'],
      },
    ],
  },
]

export function cloneFixture(id: string): Fixture {
  const base = FIXTURES.find((f) => f.id === id) ?? FIXTURES[0]
  return structuredClone(base)
}
