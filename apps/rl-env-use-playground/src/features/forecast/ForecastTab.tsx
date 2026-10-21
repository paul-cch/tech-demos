import { useEffect, useMemo, useState } from 'react'
import { CATEGORY_LABEL, MODELS, type ModelKey, type Task, fmt, mean, meta, probScore, taskScore, tasks } from '../../lib/data'
import { Calibration, type Series } from './Calibration'

type Answers = Record<string, number>
type Scope = 'all' | 'test' | 'train'
const KEY = 'rl-env-use-playground:answers:v1'

const load = (): Answers => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function ForecastTab() {
  const [answers, setAnswers] = useState<Answers>(load)
  const [scope, setScope] = useState<Scope>('all')
  const list = useMemo(() => tasks.filter((t) => scope === 'all' || t.split === scope), [scope])
  const firstOpen = (l: Task[]) => Math.max(0, l.findIndex((t) => answers[t.id] === undefined))
  const [idx, setIdx] = useState(() => firstOpen(list))
  const [p, setP] = useState(0.5)
  const [overlay, setOverlay] = useState<ModelKey[]>(['qwenBase', 'qwenTuned'])

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(answers)), [answers])

  const task = list[Math.min(idx, list.length - 1)]
  const locked = answers[task.id]
  const revealed = locked !== undefined

  const go = (i: number) => {
    const next = Math.max(0, Math.min(list.length - 1, i))
    setIdx(next)
    setP(answers[list[next].id] ?? 0.5)
  }

  const answered = tasks.filter((t) => answers[t.id] !== undefined)
  const board = [
    { label: 'You', color: '#1c1917', score: mean(answered.map((t) => probScore(answers[t.id], t.gold))), you: true },
    { label: 'Always 50%', color: '#a8a29e', score: answered.length ? 0.75 : NaN, you: false },
    ...MODELS.map((m) => ({ label: m.short, color: m.color, score: mean(answered.map((t) => taskScore(t, m.key))), you: false })),
  ]

  const series: Series[] = [
    { label: 'You', color: '#1c1917', points: answered.map((t) => ({ p: answers[t.id], y: t.gold === 'yes' ? 1 : 0 })) },
    ...MODELS.filter((m) => overlay.includes(m.key)).map((m) => ({
      label: m.short,
      color: m.color,
      dashed: true,
      points: answered.flatMap((t) => t.models[m.key].filter((r) => r.p !== null).map((r) => ({ p: r.p as number, y: (t.gold === 'yes' ? 1 : 0) as 0 | 1 }))),
    })),
  ]

  return (
    <div className="forecast">
      <section className="task-col">
        <div className="panel toolbar">
          <div className="segmented small">
            {(['all', 'test', 'train'] as Scope[]).map((s) => (
              <button
                key={s}
                className={scope === s ? 'active' : ''}
                onClick={() => {
                  setScope(s)
                  const l = tasks.filter((t) => s === 'all' || t.split === s)
                  const i = firstOpen(l)
                  setIdx(i)
                  setP(answers[l[i].id] ?? 0.5)
                }}
              >
                {s === 'all' ? `All ${tasks.length}` : s === 'test' ? `Held-out test ${meta.nTest}` : `Train ${meta.nTrain}`}
              </button>
            ))}
          </div>
          <div className="dots" aria-label="Progress">
            {list.map((t, i) => {
              const a = answers[t.id]
              const s = a === undefined ? null : probScore(a, t.gold)
              return (
                <button
                  key={t.id}
                  title={`${i + 1}. ${t.case}${s === null ? '' : ` · your score ${fmt(s)}`}`}
                  className={`pip ${i === idx ? 'current' : ''} ${s === null ? '' : s > 0.75 ? 'good' : s < 0.75 ? 'bad' : 'tie'}`}
                  onClick={() => go(i)}
                />
              )
            })}
          </div>
          <span className="count">
            {idx + 1} / {list.length}
          </span>
        </div>

        <article className="panel task">
          <div className="badges">
            <a className="badge nct" href={`https://clinicaltrials.gov/study/${task.case.match(/NCT\d{8}/)?.[0] ?? task.case}`} target="_blank" rel="noreferrer">
              {task.case}
            </a>
            <span className="badge">{CATEGORY_LABEL[task.category] ?? task.category}</span>
            <span className="badge">{task.difficulty}</span>
            <span className={`badge split-${task.split}`}>{task.split === 'test' ? 'held-out test' : 'train (climb read these failures)'}</span>
          </div>
          <h2 className="question">{task.prompt}</h2>
          <details className="materials" open>
            <summary>
              Registered protocol the model sees <span>{task.context.length.toLocaleString()} chars</span>
            </summary>
            <pre>{task.context}</pre>
          </details>

          <div className={`forecast-box ${revealed ? 'locked' : ''}`}>
            <div className="prob">
              <label htmlFor="p">Your probability it resolved YES</label>
              <output>{Math.round((revealed ? locked : p) * 100)}%</output>
            </div>
            <input id="p" type="range" min={0} max={1} step={0.01} value={revealed ? locked : p} disabled={revealed} onChange={(e) => setP(+e.target.value)} />
            <div className="quick">
              {[0.1, 0.25, 0.5, 0.75, 0.9].map((q) => (
                <button key={q} disabled={revealed} className={!revealed && p === q ? 'active' : ''} onClick={() => setP(q)}>
                  {q * 100}%
                </button>
              ))}
              <span className="spacer" />
              {!revealed ? (
                <button className="primary" onClick={() => setAnswers({ ...answers, [task.id]: p })}>
                  Lock in &amp; reveal
                </button>
              ) : (
                <button className="primary" disabled={idx >= list.length - 1} onClick={() => go(idx + 1)}>
                  Next trial →
                </button>
              )}
            </div>
          </div>

          {revealed && <Reveal task={task} p={locked} />}
        </article>
      </section>

      <aside className="side">
        <div className="panel side-card">
          <h3>Running score · 1 − Brier · {answered.length} answered</h3>
          <ul className="board">
            {board.map((b) => (
              <li key={b.label} className={b.you ? 'you' : ''}>
                <span className="name">
                  <i style={{ background: b.color }} />
                  {b.label}
                </span>
                <span className="bar">
                  <span style={{ width: `${Number.isFinite(b.score) ? b.score * 100 : 0}%`, background: b.color }} />
                </span>
                <span className="val">{fmt(b.score)}</span>
              </li>
            ))}
          </ul>
          <p className="note">
            Same reward as <code>graders.prob_score</code>: 1 − (p − outcome)². Models are scored on the same tasks you answered, averaged over their stored reps. Always 50% is 0.75 on every task.
          </p>
        </div>

        <div className="panel side-card">
          <h3>Calibration · reliability bins</h3>
          <Calibration series={series} />
          <div className="chips">
            {MODELS.map((m) => (
              <button
                key={m.key}
                className={`chip ${overlay.includes(m.key) ? 'active' : ''}`}
                onClick={() => setOverlay(overlay.includes(m.key) ? overlay.filter((k) => k !== m.key) : [...overlay, m.key])}
              >
                {m.short}
              </button>
            ))}
          </div>
          <p className="note">Five 20%-wide bins; dot size = forecasts in the bin. Model series use every stored rep on the tasks you answered.</p>
        </div>

        <div className="panel side-card">
          <h3>Repo numbers on held-out test ({meta.nTest} tasks)</h3>
          <dl className="ref">
            <div>
              <dt>Qwen base → climbed (fresh reps)</dt>
              <dd>
                {fmt(meta.finalRegraded.baseline_test)} → {fmt(meta.finalRegraded.best_test)}
              </dd>
            </div>
            {MODELS.slice(2).map((m) => (
              <div key={m.key}>
                <dt>{m.label}</dt>
                <dd>{fmt(meta.headline[m.key].test)}</dd>
              </div>
            ))}
            <div>
              <dt>Always 50%</dt>
              <dd>0.75</dd>
            </div>
          </dl>
          <button
            className="link"
            onClick={() => {
              if (confirm('Clear all your forecasts?')) {
                setAnswers({})
                setIdx(0)
                setP(0.5)
              }
            }}
          >
            Reset my forecasts
          </button>
        </div>
      </aside>
    </div>
  )
}

function Reveal({ task, p }: { task: Task; p: number }) {
  const yours = probScore(p, task.gold)
  return (
    <div className="reveal">
      <div className={`verdict ${task.gold}`}>
        <span className="gold">Resolved {task.gold.toUpperCase()}</span>
        <span>
          You said {Math.round(p * 100)}% → score <strong>{fmt(yours)}</strong> {yours > 0.75 ? '(beat always-50%)' : yours < 0.75 ? '(below always-50%)' : '(tied with always-50%)'}
        </span>
      </div>
      <table className="runs">
        <thead>
          <tr>
            <th>Policy</th>
            <th>Stored answers (one per rep)</th>
            <th className="num">Mean score</th>
          </tr>
        </thead>
        <tbody>
          <tr className="you">
            <td>You</td>
            <td>
              <span className="ans">{p}</span>
            </td>
            <td className="num">{fmt(yours)}</td>
          </tr>
          <tr>
            <td>Always 50%</td>
            <td>
              <span className="ans">0.5</span>
            </td>
            <td className="num">0.75</td>
          </tr>
          {MODELS.map((m) => (
            <tr key={m.key}>
              <td>
                <i className="sw" style={{ background: m.color }} />
                {m.label}
              </td>
              <td className="answers">
                {task.models[m.key].map((r) => (
                  <span key={r.rep} className={`ans ${r.score >= 0.75 ? 'good' : r.score < 0.5 ? 'bad' : ''}`} title={`rep ${r.rep} · score ${fmt(r.score, 3)}`}>
                    {r.p === null ? `“${r.answer}”` : r.p}
                  </span>
                ))}
              </td>
              <td className="num">{fmt(taskScore(task, m.key))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {task.split === 'train' && <p className="note">This is a train task: the climb’s proposer read Qwen’s failures here, so the climbed prompt’s score on it is in-sample.</p>}
      {task.whyHard && (
        <p className="why">
          <strong>Why the builder kept it as hard:</strong> {task.whyHard}
        </p>
      )}
      {task.evidence.map((e, i) => (
        <details key={i} className="evidence">
          <summary>
            Posted results the gold was computed from ·{' '}
            <a href={e.url} target="_blank" rel="noreferrer">
              {e.url.replace('https://', '')}
            </a>
          </summary>
          <pre>{e.quote}</pre>
        </details>
      ))}
    </div>
  )
}
