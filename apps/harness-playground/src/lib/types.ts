export type Phase = 'idle' | 'plan' | 'act' | 'observe' | 'done'

export type CheckStatus = 'pending' | 'fail' | 'pass'

export interface VerificationCheck {
  id: string
  label: string
  detail: string
  status: CheckStatus
}

export interface EnvFile {
  path: string
  content: string
  missing?: boolean
  lintIssues?: number
}

export interface Fixture {
  id: string
  name: string
  summary: string
  tag: string
  goal: string
  files: EnvFile[]
  checks: VerificationCheck[]
  /** Scripted loop steps the mock agent will walk */
  steps: AgentStep[]
}

export interface AgentStep {
  phase: Exclude<Phase, 'idle' | 'done'>
  title: string
  detail: string
  /** File path mutations applied after this step (content replacement) */
  fileUpdates?: Array<{ path: string; content: string; missing?: boolean; lintIssues?: number }>
  /** Check ids that become pass after this step */
  passChecks?: string[]
  /** Check ids that become fail (or stay fail) after this step */
  failChecks?: string[]
}

export interface LoopEvent {
  index: number
  phase: AgentStep['phase']
  title: string
  detail: string
  at: number
}
