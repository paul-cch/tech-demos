import { layout, layoutWithLines, prepareWithSegments, type PreparedTextWithSegments } from '@chenglou/pretext'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { FAMILIES, ensureFonts, fontFamilyStack, fontShorthand, type FamilyId } from '../../lib/fonts'
import { normalizeLine, readDomLines } from '../../lib/domLines'
import { PRESETS, presetById, type PresetId } from '../../lib/presets'

type Prepared = { key: string; handle: PreparedTextWithSegments; prepareMs: number }
type DomResult = { height: number; lines: string[] }
type SweepResult = { widths: number; heightMatches: number; breakMatches: number; worstDiff: number; misses: Miss[] }
type Miss = { width: number; heightDiff: number; pretext: string[]; dom: string[] }

const SWEEP_MIN = 120
const SWEEP_MAX = 600
const SWEEP_STEP = 8

export function MeasureTab() {
  const [presetId, setPresetId] = useState<PresetId>('latin')
  const [text, setText] = useState(presetById('latin').text)
  const [width, setWidth] = useState(360)
  const [family, setFamily] = useState<FamilyId>('inter')
  const [size, setSize] = useState(17)
  const [lineHeightRatio, setLineHeightRatio] = useState(1.5)
  const [weight, setWeight] = useState(400)
  const [preWrap, setPreWrap] = useState(false)
  const [prepared, setPrepared] = useState<Prepared | null>(null)
  const [dom, setDom] = useState<DomResult | null>(null)
  const [sweep, setSweep] = useState<SweepResult | null>(null)
  const domRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLDivElement>(null)

  const cleanText = text.replace(/\r\n?/g, '\n')
  const font = fontShorthand(family, weight, size)
  const lineHeight = Math.round(size * lineHeightRatio)
  const whiteSpace = preWrap ? 'pre-wrap' : 'normal'
  const prepKey = `${font}|${whiteSpace}|${cleanText}`

  // prepare(): once per text/font/options, after the fonts it needs load.
  useEffect(() => {
    let cancelled = false
    ensureFonts(font, cleanText).then(() => {
      if (cancelled) return
      const t0 = performance.now()
      const handle = prepareWithSegments(cleanText, font, { whiteSpace })
      setPrepared({ key: prepKey, handle, prepareMs: performance.now() - t0 })
      setSweep(null)
    })
    return () => {
      cancelled = true
    }
  }, [prepKey, font, cleanText, whiteSpace])

  const ready = prepared?.key === prepKey ? prepared : null

  // layout(): the cheap hot path, re-run on every width / line-height change.
  const result = useMemo(() => {
    if (!ready) return null
    const lines = layoutWithLines(ready.handle, width, lineHeight)
    // Timer resolution is coarse in browsers, so loop for ~4ms and average.
    let runs = 0
    const t0 = performance.now()
    let elapsed = 0
    while (elapsed < 4) {
      for (let i = 0; i < 100; i++) layout(ready.handle, width, lineHeight)
      runs += 100
      elapsed = performance.now() - t0
    }
    const layoutMs = elapsed / runs
    return { ...lines, layoutMs }
  }, [ready, width, lineHeight])

  // Ground truth: what the browser actually rendered.
  useLayoutEffect(() => {
    const el = domRef.current
    if (!el || !ready) return
    setDom({ height: el.getBoundingClientRect().height, lines: readDomLines(el, lineHeight) })
  }, [ready, width, lineHeight, cleanText, font, preWrap])

  const runSweep = useCallback(() => {
    const el = probeRef.current
    if (!el || !ready) return
    let widths = 0
    let heightMatches = 0
    let breakMatches = 0
    let worstDiff = 0
    const misses: Miss[] = []
    for (let w = SWEEP_MIN; w <= SWEEP_MAX; w += SWEEP_STEP) {
      el.style.width = `${w}px`
      const domHeight = el.getBoundingClientRect().height
      const predicted = layoutWithLines(ready.handle, w, lineHeight)
      const diff = domHeight - predicted.height
      widths++
      if (Math.abs(diff) < 0.5) heightMatches++
      worstDiff = Math.max(worstDiff, Math.abs(diff))
      const domLines = readDomLines(el, lineHeight)
      const ours = predicted.lines.map((l) => normalizeLine(l.text))
      const same = sameLines(ours, domLines)
      if (same) breakMatches++
      if (!same || Math.abs(diff) >= 0.5) misses.push({ width: w, heightDiff: diff, pretext: ours, dom: domLines })
    }
    el.style.width = ''
    ;(window as unknown as { __pretextSweep?: Miss[] }).__pretextSweep = misses
    setSweep({ widths, heightMatches, breakMatches, worstDiff, misses })
  }, [ready, lineHeight])

  const pretextLines = result?.lines ?? []
  const pretextNormalized = pretextLines.map((l) => normalizeLine(l.text))
  const heightDiff = dom && result ? dom.height - result.height : null
  const breaksMatch = dom ? sameLines(pretextNormalized, dom.lines) : false
  const status = heightDiff === null ? 'pending' : Math.abs(heightDiff) < 0.5 && breaksMatch ? 'match' : Math.abs(heightDiff) < 0.5 ? 'partial' : 'mismatch'

  // Longhands only: React mixing the the font shorthand shorthand with lineHeight resets line-height on rerender.
  const fontStyle: CSSProperties = { fontFamily: fontFamilyStack(family), fontSize: size, fontWeight: weight, lineHeight: `${lineHeight}px` }
  const textStyle: CSSProperties = {
    ...fontStyle,
    width,
    whiteSpace: preWrap ? 'pre-wrap' : 'normal',
    overflowWrap: 'break-word',
  }

  const choosePreset = (id: PresetId) => {
    setPresetId(id)
    setText(presetById(id).text)
    if (id === 'arabic') setFamily('notoArabic')
    else if (id === 'cjk') setFamily('notoSc')
    else setFamily('inter')
  }

  return (
    <div className="measure">
      <aside className="panel controls">
        <section>
          <h3>Text</h3>
          <div className="chips" role="radiogroup" aria-label="Preset">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" className={p.id === presetId ? 'chip active' : 'chip'} onClick={() => choosePreset(p.id)} data-preset={p.id}>
                {p.label}
              </button>
            ))}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} dir="auto" spellCheck={false} style={{ fontFamily: fontFamilyStack(family) }} />
        </section>

        <section>
          <h3>Box</h3>
          <Slider label="Width" value={width} min={SWEEP_MIN} max={SWEEP_MAX} step={1} unit="px" onChange={setWidth} testId="width" />
          <label className="toggle">
            <input type="checkbox" checked={preWrap} onChange={(e) => setPreWrap(e.target.checked)} />
            <span>white-space: pre-wrap</span>
          </label>
        </section>

        <section>
          <h3>Font</h3>
          <label className="field">
            <span>Family</span>
            <select value={family} onChange={(e) => setFamily(e.target.value as FamilyId)}>
              {Object.entries(FAMILIES).map(([id, f]) => (
                <option key={id} value={id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Weight</span>
            <select value={weight} onChange={(e) => setWeight(Number(e.target.value))}>
              {[400, 500, 600, 700].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
          <Slider label="Size" value={size} min={12} max={32} step={1} unit="px" onChange={setSize} />
          <Slider label="Line height" value={lineHeightRatio} min={1} max={2.2} step={0.05} unit="×" onChange={setLineHeightRatio} format={(v) => `${v.toFixed(2)}× · ${lineHeight}px`} />
          <code className="font-string">{`prepare(text, '${font}')`}</code>
        </section>
      </aside>

      <div className="measure-main">
        <div className={`panel match ${status}`} data-testid="match">
          <div className="match-headline">
            <span className="dot" />
            <strong data-testid="match-label">
              {status === 'match' ? 'Exact match' : status === 'partial' ? 'Same height, different breaks' : status === 'mismatch' ? 'Height differs' : 'Loading fonts…'}
            </strong>
          </div>
          <dl className="stats">
            <Stat label="Height diff" value={heightDiff === null ? '—' : `${formatDiff(heightDiff)} px`} testId="height-diff" />
            <Stat label="Pretext height" value={result ? `${result.height}px` : '—'} testId="pretext-height" />
            <Stat label="DOM height" value={dom ? `${round2(dom.height)}px` : '—'} testId="dom-height" />
            <Stat label="Lines" value={result && dom ? `${result.lineCount} / ${dom.lines.length}` : '—'} testId="lines" />
            <Stat label="prepare()" value={ready ? `${ready.prepareMs.toFixed(2)} ms` : '—'} />
            <Stat label="layout()" value={result ? `${(result.layoutMs * 1000).toFixed(2)} µs` : '—'} />
          </dl>
          <div className="sweep">
            <button type="button" onClick={runSweep} disabled={!ready} data-testid="sweep">
              Sweep {SWEEP_MIN}–{SWEEP_MAX}px
            </button>
            <span data-testid="sweep-result">
              {sweep
                ? `${sweep.heightMatches}/${sweep.widths} heights match · ${sweep.breakMatches}/${sweep.widths} identical line breaks · worst ${round2(sweep.worstDiff)}px`
                : 'Compare Pretext against the DOM at every 8px step.'}
            </span>
            {sweep && sweep.misses.length > 0 && (
              <span className="misses">
                Differs at:{' '}
                {sweep.misses.slice(0, 8).map((m) => (
                  <button key={m.width} type="button" className="miss" onClick={() => setWidth(m.width)} title="Jump to this width">
                    {m.width}px
                  </button>
                ))}
                {sweep.misses.length > 8 ? ` +${sweep.misses.length - 8}` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="columns">
          <figure className="panel column">
            <figcaption>
              <span className="tag tag-pretext">Pretext</span> layoutWithLines() — computed, no DOM measurement
            </figcaption>
            <div className="stage">
              <div className="lines" style={{ width, height: result?.height ?? 0 }}>
                {pretextLines.map((line, i) => (
                  <div key={i} className="line" style={{ top: i * lineHeight, height: lineHeight }}>
                    <span className="line-text" dir="auto" style={{ ...fontStyle, whiteSpace: 'pre' }}>
                      {line.text}
                    </span>
                    <span className={dom && normalizeLine(line.text) !== dom.lines[i] ? 'line-meta diff' : 'line-meta'}>{line.width.toFixed(1)}</span>
                  </div>
                ))}
                <div className="edge" />
              </div>
            </div>
          </figure>

          <figure className="panel column">
            <figcaption>
              <span className="tag tag-dom">Browser</span> real DOM paint at the same width
            </figcaption>
            <div className="stage">
              <div className="dom-box" style={{ width }}>
                <div ref={domRef} dir="auto" style={textStyle}>
                  {cleanText}
                </div>
                <div className="edge" />
              </div>
            </div>
          </figure>
        </div>
      </div>

      <div ref={probeRef} className="probe" dir="auto" aria-hidden style={textStyle}>
        {cleanText}
      </div>
    </div>
  )
}

function sameLines(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((l, i) => l === b[i])
}

const round2 = (n: number) => Math.round(n * 100) / 100
const formatDiff = (n: number) => (Math.abs(n) < 0.005 ? '0' : `${n > 0 ? '+' : ''}${round2(n)}`)

function Stat({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd data-testid={testId}>{value}</dd>
    </div>
  )
}

export function Slider(props: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
  format?: (v: number) => string
  testId?: string
}) {
  return (
    <label className="field slider">
      <span>{props.label}</span>
      <output>{props.format ? props.format(props.value) : `${props.value}${props.unit}`}</output>
      <input type="range" min={props.min} max={props.max} step={props.step} value={props.value} onChange={(e) => props.onChange(Number(e.target.value))} data-testid={props.testId} />
    </label>
  )
}
