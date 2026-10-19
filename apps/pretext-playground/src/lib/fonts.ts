import { clearCache } from '@chenglou/pretext'

// Bundled web fonts (see main.tsx) so the box, a Mac and a Linux laptop all
// measure the same faces. Pretext needs named fonts, not system-ui.
export const FAMILIES = {
  inter: { label: 'Inter', css: '"Inter Variable"' },
  notoSc: { label: 'Noto Sans SC', css: '"Noto Sans SC"' },
  notoArabic: { label: 'Noto Sans Arabic', css: '"Noto Sans Arabic"' },
} as const

export type FamilyId = keyof typeof FAMILIES

const FALLBACKS = ['"Inter Variable"', '"Noto Sans SC"', '"Noto Sans Arabic"', '"Apple Color Emoji"', '"Noto Color Emoji"', 'sans-serif']

export function fontFamilyStack(primary: FamilyId): string {
  const first = FAMILIES[primary].css
  return [first, ...FALLBACKS.filter((f) => f !== first)].join(', ')
}

/** Canvas font shorthand — the exact string Pretext and the DOM both use. */
export function fontShorthand(primary: FamilyId, weight: number, sizePx: number): string {
  return `${weight} ${sizePx}px ${fontFamilyStack(primary)}`
}

/**
 * Wait until every face this text needs is loaded, then drop Pretext's
 * width cache (widths measured before a web font loads are the fallback's).
 */
export async function ensureFonts(font: string, text: string): Promise<void> {
  await document.fonts.load(font, text || 'a')
  await document.fonts.ready
  clearCache()
}
