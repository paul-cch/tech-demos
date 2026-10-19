const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/**
 * Read the browser's own line breaks back out of a rendered element by
 * asking for the client rect of every grapheme and grouping by row.
 * Used only to *verify* Pretext; Pretext itself never touches the DOM.
 */
export function readDomLines(el: HTMLElement, lineHeight: number): string[] {
  const node = el.firstChild
  if (!node || node.nodeType !== Node.TEXT_NODE) return []
  const text = node.textContent ?? ''
  const range = document.createRange()
  const lines: string[] = []
  let current = ''
  let rowTop: number | null = null

  for (const { segment, index } of graphemes.segment(text)) {
    if (segment === '\n') {
      continue
    }
    range.setStart(node, index)
    range.setEnd(node, index + segment.length)
    const rects = range.getClientRects()
    const isSpace = /^\s+$/.test(segment)
    if (rects.length === 0 || isSpace) {
      current += segment
      continue
    }
    const top = rects[0].top
    if (rowTop === null) {
      rowTop = top
    } else if (top > rowTop + lineHeight / 2) {
      lines.push(current)
      current = ''
      rowTop = top
    }
    current += segment
  }
  if (current.trim() !== '' || lines.length === 0) lines.push(current)
  return lines.map(normalizeLine)
}

export const normalizeLine = (s: string): string => s.replace(/\s+/g, ' ').trim()
