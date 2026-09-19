// src/utils/m3Palette.js

/**
 * 10 Harmonized M3 Content Roles.
 * Every item contains paired container and onContainer colors
 * to guarantee WCAG 2.2 AA/AAA legibility across all backgrounds.
 */
export const M3_CONTENT_PALETTE = [
  { id: 'coral',   label: 'Coral',   accent: '#D84E29', container: '#FFDBCF', onContainer: '#380D02' },
  { id: 'amber',   label: 'Amber',   accent: '#C68900', container: '#FFE08B', onContainer: '#241A00' },
  { id: 'emerald', label: 'Emerald', accent: '#1B9A5B', container: '#B8F5D0', onContainer: '#002110' },
  { id: 'teal',    label: 'Teal',    accent: '#00838F', container: '#AFECEF', onContainer: '#002022' },
  { id: 'cyan',    label: 'Cyan',    accent: '#007FB6', container: '#C2E8FF', onContainer: '#001E2C' },
  { id: 'indigo',  label: 'Indigo',  accent: '#4355B9', container: '#DEE0FF', onContainer: '#001159' },
  { id: 'violet',  label: 'Violet',  accent: '#7C3AED', container: '#EADBFF', onContainer: '#24005B' },
  { id: 'pink',    label: 'Pink',    accent: '#CE378B', container: '#FFD8EC', onContainer: '#370729' },
  { id: 'rose',    label: 'Rose',    accent: '#DC2626', container: '#FFD9DF', onContainer: '#3B0813' },
  { id: 'slate',   label: 'Slate',   accent: '#5C6479', container: '#E0E2EC', onContainer: '#181C22' },
]

/**
 * Helper to determine high-contrast text (dark or light) for legacy arbitrary hex codes.
 */
function getContrastingTextColor(hex) {
  if (!hex || typeof hex !== 'string') return '#1A1B21'
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length < 6) return '#1A1B21'

  const r = parseInt(cleanHex.substring(0, 2), 16) || 0
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0

  // Perceived luminance formula (YIQ)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 140 ? '#1A1B21' : '#FFFFFF'
}

/**
 * Maps legacy pastel defaults to their nearest M3 token
 */
const LEGACY_COLOR_MAP = {
  '#fca5a5': 'coral',
  '#93c5fd': 'indigo',
  '#fde68a': 'amber',
  '#bbf7d0': 'emerald',
  '#bfdbfe': 'cyan',
  '#fbcfe8': 'pink',
  '#e9d5ff': 'violet',
  '#fed7aa': 'amber',
  '#f87171': 'rose',
  '#fbbf24': 'amber',
  '#facc15': 'amber',
  '#4ade80': 'emerald',
  '#2dd4bf': 'teal',
  '#22d3ee': 'cyan',
  '#60a5fa': 'indigo',
  '#818cf8': 'indigo',
  '#a78bfa': 'violet',
  '#f472b6': 'pink',
}

/**
 * Resolves a full M3 Color Token from a token ID, hex accent, or legacy hex code.
 * Always returns a valid object with { id, label, accent, container, onContainer }.
 */
export function getColorToken(colorOrId) {
  if (!colorOrId) return null

  // 1. Direct ID match (e.g. 'coral')
  const byId = M3_CONTENT_PALETTE.find(item => item.id === colorOrId)
  if (byId) return byId

  // 2. Direct Accent / Container hex match
  const byHex = M3_CONTENT_PALETTE.find(
    item => item.accent.toLowerCase() === colorOrId.toLowerCase() ||
            item.container.toLowerCase() === colorOrId.toLowerCase()
  )
  if (byHex) return byHex

  // 3. Known legacy color lookup
  const mappedId = LEGACY_COLOR_MAP[colorOrId.toLowerCase()]
  if (mappedId) {
    const legacyMatch = M3_CONTENT_PALETTE.find(item => item.id === mappedId)
    if (legacyMatch) return legacyMatch
  }

  // 4. Fallback for unmapped custom hex values: compute contrasting text dynamically
  return {
    id: colorOrId,
    label: 'Custom',
    accent: colorOrId,
    container: colorOrId,
    onContainer: getContrastingTextColor(colorOrId),
  }
}