import { useState } from 'react'
import { type Paired, fmt, hill, meta, signed } from '../../lib/data'
import { lineDiff } from './diff'

const LO = -0.12
const HI = 0.5

function CI({ r, wide }: { r: Paired; wide?: boolean }) {
  const x = (v: number) => `${((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * 100}%`
  const tone = r.lo > 0 ? 'up' : r.hi < 0 ? 'down' : 'flat'
  return (
    <span className={`ci ${tone} ${wide ? 'wide' : ''}`} title={`diff ${signed(r.diff)} · 95% CI [${signed(r.lo)}, ${signed(r.hi)}] · P(better) ${r.p_better} · ${r.n} tasks / ${r.cases} cases`}>
      <span className="track">
        <span className="zero" style={{ left: x(0) }} />
        <span className="range" style={{ left: x(r.lo), width: `calc(${x(r.hi)} - ${x(r.lo)})` }} />
        <span className="mark" style={{ left: x(r.diff) }} />
      </span>
      <span className="ci-num">
        {signed(r.diff)} <em>[{signed(r.lo, 2)}, {signed(r.hi, 2)}]</em>
      </span>
    </span>
  )
}

export function HillclimbTab() {
  const variants = Object.keys(hill.variants).filter((v) => v !== 'baseline').sort((a, b) => +a.slice(1) - +b.slice(1))
  const [sel, setSel] = useState('v3')
  const proposed = hill.rounds.reduce((a, r) => a + r.candidates.length, 0)
  const kept = hill.rounds.filter((r) => r.decision === 'keep')
  const parentOf = (v: string) => {
    const n = +v.slice(1)
    const r = hill.rounds.find((r) => r.candidates.some((c) => c.variant === v))!
    const before = hill.rounds.filter((x) => x.round < r.round && x.decision === 'keep').pop()
    return { round: r.round, parent: before ? before.variant : 'baseline', n }
  }
  const { parent, round } = parentOf(sel)
  const diff = lineDiff(hill.variants[parent].prompt, hill.variants[sel].prompt)
  const fr = meta.finalRegraded
  const trajectory = [hill.baseline.test, ...hill.rounds.map((r) => r.test_now)]

  return (
    <div className="hill">
      <div className="summary">
        <div className="panel stat-card">
          <span className="k">Policy · proposer</span>
          <span className="v">
            {hill.policy} · {hill.proposer}
          </span>
          <span className="s">
            system-prompt climb, {hill.reps} reps/task, {hill.confidence * 100}% paired case bootstrap, ${hill.usd.toFixed(2)} spent
          </span>
        </div>
        <div className="panel stat-card">
          <span className="k">Edits proposed → kept</span>
          <span className="v">
            {proposed} → {kept.length}
          </span>
          <span className="s">
            {hill.rounds.length} rounds × {hill.rounds[0].candidates.length} candidates; kept {kept.map((r) => r.variant).join(', ')} (base-rate priors per question type)
          </span>
        </div>
        <div className="panel stat-card">
          <span className="k">Baseline at climb time</span>
          <span className="v">
            train {fmt(hill.baseline.train, 3)} · test {fmt(hill.baseline.test, 3)}
          </span>
          <span className="s">
            {hill.nTrainAtClimb}/{hill.nTestAtClimb} tasks · A/A noise ±{fmt(hill.baseline.noise, 3)} · MDE {fmt(hill.baseline.mde, 3)} (climb was forced past the 0.08 MDE gate)
          </span>
        </div>
        <div className="panel stat-card hero">
          <span className="k">Final · fresh test reps · {fr.n_test} tasks served today</span>
          <span className="v">
            {fmt(fr.baseline_test, 3)} → {fmt(fr.best_test, 3)}
          </span>
          <CI r={fr.paired} wide />
          <span className="s">
            At climb time on {hill.nTestAtClimb}: {fmt(hill.final.baseline_test, 3)} → {fmt(hill.final.best_test, 3)}, {signed(hill.final.test.diff)} [{signed(hill.final.test.lo)}, {signed(hill.final.test.hi)}] · decision: {hill.final.decision}
          </span>
        </div>
      </div>

      <div className="panel trajectory">
        <h3>Incumbent test score by round · {hill.nTestAtClimb}-task test split at climb time</h3>
        <div className="traj">
          {trajectory.map((v, i) => (
            <div key={i} className="traj-step">
              <span className="bar" style={{ height: `${(v - 0.4) * 250}px` }} />
              <span className="tv">{fmt(v, 3)}</span>
              <span className="tl">{i === 0 ? 'baseline' : `after r${i}`}</span>
            </div>
          ))}
          <div className="traj-note">
            Always-50% line is 0.75. After round 1 nothing beat the incumbent; three reverts in a row stopped the climb (stall {hill.rounds.length - 1}).
          </div>
        </div>
      </div>

      <div className="rounds">
        {hill.rounds.map((r) => {
          const best = r.variant
          return (
            <section key={r.round} className={`panel round ${r.decision === 'keep' ? 'keep' : 'revert'}`}>
              <header>
                <h3>Round {r.round}</h3>
                <span className={`pill ${r.decision === 'keep' ? 'keep' : 'revert'}`}>{r.decision === 'keep' ? `kept ${r.variant}` : r.decision}</span>
              </header>
              <div className="round-grid">
                <div>
                  <h4>Proposer's failure buckets (train only)</h4>
                  <ul className="buckets">
                    {r.buckets.map((b) => (
                      <li key={b.name}>
                        <span className={`fix ${b.fixable ? 'yes' : 'no'}`}>{b.fixable ? 'fixable' : 'noise / task'}</span>
                        <span>{b.name}</span>
                        <em>{b.task_ids.length}</em>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Candidate edits · train screen (Δ vs incumbent)</h4>
                  <ul className="cands">
                    {r.candidates.map((c) => (
                      <li key={c.variant} className={c.variant === best ? 'best' : ''}>
                        <button className={`vtag ${sel === c.variant ? 'active' : ''}`} onClick={() => setSel(c.variant)} title="Show prompt diff">
                          {c.variant}
                        </button>
                        <span className="change">{c.change}</span>
                        <CI r={c.train_screen} />
                      </li>
                    ))}
                  </ul>
                  <div className="verdict-row">
                    <span>
                      <strong>{best}</strong> to test:
                    </span>
                    <span className="lbl">train (fresh reps)</span>
                    <CI r={r.train} />
                    <span className="lbl">test</span>
                    <CI r={r.test} />
                    <span className="lbl">P(better)</span>
                    <span className="pb">{r.test.p_better}</span>
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <section className="panel prompt-view">
        <header>
          <h3>Prompt diff</h3>
          <div className="chips">
            {variants.map((v) => (
              <button key={v} className={`chip ${sel === v ? 'active' : ''} ${v === hill.incumbent ? 'kept' : ''}`} onClick={() => setSel(v)}>
                {v}
                {v === hill.incumbent ? ' ✓' : ''}
              </button>
            ))}
          </div>
        </header>
        <p className="note">
          {sel} (round {round}) vs its parent <strong>{parent}</strong>. The extension is appended to the base system prompt: <code>{hill.caseSys}</code>
        </p>
        <pre className="diff">
          {diff.map((d, i) => (
            <span key={i} className={d.op}>
              {d.op === 'add' ? '+ ' : d.op === 'del' ? '− ' : '  '}
              {d.text}
              {'\n'}
            </span>
          ))}
        </pre>
      </section>
      <p className="note foot">
        Rounds, buckets, candidates and CIs are verbatim from <code>climb-qwen-35b/_state.json</code>, recorded on the {hill.nTrainAtClimb}/{hill.nTestAtClimb} split used at climb time. A stricter critic later dropped 5 of those 40 tasks, so the env serves 35 today; the hero
        card's final numbers are regraded on the {fr.n_test} served test tasks with the repo's own <code>audit.paired</code> bootstrap, which reproduces the README's +0.25 [+0.07, +0.45]. Note: the split keeps each case key on one side, but {meta.trialsOnBothSides.length} trials ({meta.trialsOnBothSides.join(', ')}) appear under two case keys with tasks in both train and test.
      </p>
    </div>
  )
}
