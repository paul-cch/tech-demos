import { layoutNextLineRange, materializeLineRange, prepareWithSegments, type LayoutCursor, type PreparedTextWithSegments } from '@chenglou/pretext'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { ensureFonts, fontShorthand, type FamilyId } from '../../lib/fonts'
import { PRESETS, presetById, type PresetId } from '../../lib/presets'
import { Slider } from '../measure/MeasureTab'

const CANVAS_HEIGHT = 560
const MARGIN = 28
const MIN_SLOT = 48

type Shape = { x: number; y: number; r: number; kind: 'circle' | 'square' }
type Stats = { lines: number; slots: number; ms: number; overflow: boolean }

const familyFor = (id: PresetId): FamilyId => (id === 'arabic' ? 'notoArabic' : id === 'cjk' ? 'notoSc' : 'inter')

export function FlowTab() {
  const [presetId, setPresetId] = useState<PresetId>('latin')
  const [size, setSize] = useState(17)
  const [lineHeight, setLineHeight] = useState(27)
  const [gap, setGap] = useState(14)
  const [shape, setShape] = useState<Shape>({ x: 0.5, y: 0.45, r: 120, kind: 'circle' })
  const [prepared, setPrepared] = useState<{ key: string; handle: PreparedTextWithSegments } | null>(null)
  const [width, setWidth] = useState(860)
  const [stats, setStats] = useState<Stats | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)

  const preset = presetById(presetId)
  const text = Array.from({ length: 6 }, () => preset.text).join(' ')
  const font = fontShorthand(familyFor(presetId), 400, size)
  const key = `${font}|${text}`

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    ensureFonts(font, text).then(() => {
      if (!cancelled) setPrepared({ key, handle: prepareWithSegments(text, font) })
    })
    return () => {
      cancelled = true
    }
  }, [key, font, text])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !prepared || prepared.key !== key) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(CANVAS_HEIGHT * dpr)
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, CANVAS_HEIGHT)

    const cx = shape.x * width
    const cy = shape.y * CANVAS_HEIGHT
    const r = shape.r

    // Shape
    ctx.save()
    ctx.fillStyle = 'rgba(79, 70, 229, 0.10)'
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.55)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    if (shape.kind === 'circle') ctx.arc(cx, cy, r, 0, Math.PI * 2)
    else ctx.roundRect(cx - r, cy - r, r * 2, r * 2, 18)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    // Text: one row at a time, each row split into the slots left and right of the shape.
    const t0 = performance.now()
    ctx.font = font
    ctx.fillStyle = '#1c1917'
    ctx.textBaseline = 'middle'
    ctx.direction = preset.rtl ? 'rtl' : 'ltr'
    ctx.textAlign = preset.rtl ? 'right' : 'left'
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
    let lines = 0
    let slots = 0
    let done = false
    for (let y = MARGIN; y + lineHeight <= CANVAS_HEIGHT - MARGIN && !done; y += lineHeight) {
      const blocked = blockedSpan(shape.kind, cx, cy, r + gap, y, y + lineHeight)
      let rowSlots: Array<[number, number]> = blocked
        ? [
            [MARGIN, blocked[0]],
            [blocked[1], width - MARGIN],
          ]
        : [[MARGIN, width - MARGIN]]
      rowSlots = rowSlots.filter(([a, b]) => b - a >= MIN_SLOT)
      if (preset.rtl) rowSlots.reverse()
      for (const [left, right] of rowSlots) {
        const slotWidth = Math.floor(right - left)
        const range = layoutNextLineRange(prepared.handle, slotWidth, cursor)
        if (range === null) {
          done = true
          break
        }
        const line = materializeLineRange(prepared.handle, range)
        ctx.fillText(line.text.trim(), preset.rtl ? right : left, y + lineHeight / 2)
        cursor = range.end
        lines++
        slots++
      }
    }
    const ms = performance.now() - t0
    setStats({ lines, slots, ms, overflow: !done })
  }, [prepared, key, width, shape, lineHeight, gap, font, preset.rtl])

  const toLocal = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e)
    const cx = shape.x * width
    const cy = shape.y * CANVAS_HEIGHT
    if (Math.hypot(p.x - cx, p.y - cy) <= shape.r * 1.2) {
      drag.current = { dx: p.x - cx, dy: p.y - cy }
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }
  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e)
    const cx = shape.x * width
    const cy = shape.y * CANVAS_HEIGHT
    e.currentTarget.style.cursor = drag.current ? 'grabbing' : Math.hypot(p.x - cx, p.y - cy) <= shape.r * 1.2 ? 'grab' : 'default'
    if (!drag.current) return
    const nx = clamp((p.x - drag.current.dx) / width, 0, 1)
    const ny = clamp((p.y - drag.current.dy) / CANVAS_HEIGHT, 0, 1)
    setShape((s) => ({ ...s, x: nx, y: ny }))
  }
  const onUp = () => {
    drag.current = null
  }

  return (
    <div className="flow">
      <div className="panel flow-toolbar">
        <div className="chips">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className={p.id === presetId ? 'chip active' : 'chip'} onClick={() => setPresetId(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="segmented">
          {(['circle', 'square'] as const).map((k) => (
            <button key={k} type="button" className={shape.kind === k ? 'active' : ''} onClick={() => setShape((s) => ({ ...s, kind: k }))}>
              {k === 'circle' ? 'Circle' : 'Square'}
            </button>
          ))}
        </div>
        <Slider label="Shape" value={shape.r} min={40} max={200} step={1} unit="px" onChange={(r) => setShape((s) => ({ ...s, r }))} />
        <Slider label="Gap" value={gap} min={0} max={40} step={1} unit="px" onChange={setGap} />
        <Slider label="Size" value={size} min={12} max={28} step={1} unit="px" onChange={(v) => { setSize(v); setLineHeight(Math.round(v * 1.6)) }} />
      </div>

      <div className="panel canvas-wrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          style={{ width, height: CANVAS_HEIGHT }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          data-testid="flow-canvas"
        />
      </div>

      <p className="flow-caption">
        Drag the shape. Every row asks <code>layoutNextLineRange(prepared, slotWidth, cursor)</code> for the next line that fits the space left beside it, then paints it with <code>fillText</code>. DOM text can only flow around floats; this is free-form.
        {stats && (
          <span className="flow-stats" data-testid="flow-stats">
            {' '}
            {stats.slots} line slots · laid out + painted in {stats.ms.toFixed(2)} ms{stats.overflow ? ' · text continues past the canvas' : ''}
          </span>
        )}
      </p>
    </div>
  )
}

/** Horizontal interval the shape blocks within the row [y0, y1], or null. */
function blockedSpan(kind: Shape['kind'], cx: number, cy: number, r: number, y0: number, y1: number): [number, number] | null {
  if (y1 <= cy - r || y0 >= cy + r) return null
  if (kind === 'square') return [cx - r, cx + r]
  const dy = cy < y0 ? y0 - cy : cy > y1 ? cy - y1 : 0
  const half = Math.sqrt(Math.max(0, r * r - dy * dy))
  return [cx - half, cx + half]
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
