import { fmt } from '../../lib/data'

export type Point = { p: number; y: 0 | 1 }
export type Series = { label: string; color: string; points: Point[]; dashed?: boolean }

const BINS = 5
const W = 300
const H = 260
const PAD = { l: 38, r: 12, t: 12, b: 34 }

export function bin(points: Point[]) {
  const out: { p: number; freq: number; n: number }[] = []
  for (let b = 0; b < BINS; b++) {
    const lo = b / BINS
    const hi = (b + 1) / BINS
    const inBin = points.filter((x) => x.p >= lo && (b === BINS - 1 ? x.p <= hi : x.p < hi))
    if (!inBin.length) continue
    out.push({
      p: inBin.reduce((a, x) => a + x.p, 0) / inBin.length,
      freq: inBin.reduce((a, x) => a + x.y, 0) / inBin.length,
      n: inBin.length,
    })
  }
  return out
}

export function Calibration({ series }: { series: Series[] }) {
  const x = (v: number) => PAD.l + v * (W - PAD.l - PAD.r)
  const y = (v: number) => H - PAD.b - v * (H - PAD.t - PAD.b)
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1]
  return (
    <div className="calib">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Reliability diagram">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={y(0)} y2={y(1)} className="grid" />
            <line x1={x(0)} x2={x(1)} y1={y(t)} y2={y(t)} className="grid" />
            <text x={x(t)} y={H - PAD.b + 14} textAnchor="middle" className="tick">
              {t * 100}%
            </text>
            <text x={PAD.l - 6} y={y(t) + 3.5} textAnchor="end" className="tick">
              {t * 100}%
            </text>
          </g>
        ))}
        <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} className="diag" />
        <text x={(x(0) + x(1)) / 2} y={H - 4} textAnchor="middle" className="axis">
          forecast probability (bin mean)
        </text>
        <text transform={`translate(10 ${(y(0) + y(1)) / 2}) rotate(-90)`} textAnchor="middle" className="axis">
          resolved yes
        </text>
        {series.map((s) => {
          const pts = bin(s.points)
          return (
            <g key={s.label}>
              <polyline points={pts.map((b) => `${x(b.p)},${y(b.freq)}`).join(' ')} fill="none" stroke={s.color} strokeWidth={1.6} strokeDasharray={s.dashed ? '4 3' : undefined} opacity={0.85} />
              {pts.map((b) => (
                <circle key={b.p} cx={x(b.p)} cy={y(b.freq)} r={3 + Math.sqrt(b.n) * 1.6} fill={s.color} fillOpacity={0.18} stroke={s.color} strokeWidth={1.4}>
                  <title>{`${s.label}: ${b.n} forecast${b.n === 1 ? '' : 's'}, mean ${fmt(b.p * 100, 0)}%, resolved yes ${fmt(b.freq * 100, 0)}%`}</title>
                </circle>
              ))}
            </g>
          )
        })}
      </svg>
      <div className="legend">
        {series.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} /> {s.label} <em>({s.points.length})</em>
          </span>
        ))}
      </div>
    </div>
  )
}
