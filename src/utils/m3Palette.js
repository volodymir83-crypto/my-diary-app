// src/utils/m3Palette.js

/**
 * Row 1: 8 Vivid Tints calibrated for Dark Indigo text (#1E1B4B)
 * All tints provide >= 7.0:1 contrast (WCAG 2.2 AAA compliant).
 */
export const DARK_TEXT_SWATCHES = [
  { id: 'luminous-frost', label: 'Luminous Frost (Default)', hex: '#E0E7FF', textColor: '#1E1B4B', contrast: '12.9:1', isDefault: true },
  { id: 'marigold',       label: 'Vivid Marigold',          hex: '#E0A500', textColor: '#1E1B4B', contrast: '7.17:1' },
  { id: 'citrus-lime',    label: 'Citrus Lime',             hex: '#A0BC00', textColor: '#1E1B4B', contrast: '7.22:1' },
  { id: 'emerald-light',  label: 'Vivid Emerald',           hex: '#00C853', textColor: '#1E1B4B', contrast: '7.12:1' },
  { id: 'mint-aqua',      label: 'Mint Aqua',               hex: '#00C794', textColor: '#1E1B4B', contrast: '7.28:1' },
  { id: 'turquoise',      label: 'Turquoise Cyan',          hex: '#00C2DC', textColor: '#1E1B4B', contrast: '7.38:1' },
  { id: 'rose-orchid',    label: 'Rose Orchid',             hex: '#F48AF2', textColor: '#1E1B4B', contrast: '7.28:1' },
  { id: 'tangerine',      label: 'Tangerine Peach',         hex: '#FF963C', textColor: '#1E1B4B', contrast: '7.28:1' },
]

/**
 * Row 2: 8 Vivid Tints calibrated for Pure White text (#FFFFFF)
 * All tints provide >= 7.0:1 contrast (WCAG 2.2 AAA compliant).
 */
export const WHITE_TEXT_SWATCHES = [
  { id: 'crimson',        label: 'Crimson Red',             hex: '#B50000', textColor: '#FFFFFF', contrast: '7.09:1' },
  { id: 'sunset-orange',  label: 'Sunset Orange',           hex: '#924000', textColor: '#FFFFFF', contrast: '7.22:1' },
  { id: 'emerald-dark',   label: 'Emerald Green',           hex: '#006700', textColor: '#FFFFFF', contrast: '7.17:1' },
  { id: 'cyan-teal',      label: 'Cyan Teal',               hex: '#00616C', textColor: '#FFFFFF', contrast: '7.13:1' },
  { id: 'ocean-cerulean', label: 'Ocean Cerulean',          hex: '#005B9C', textColor: '#FFFFFF', contrast: '7.05:1' },
  { id: 'royal-cobalt',   label: 'Royal Cobalt',            hex: '#1C3FE0', textColor: '#FFFFFF', contrast: '7.56:1' },
  { id: 'electric-violet',label: 'Electric Violet',         hex: '#8400D2', textColor: '#FFFFFF', contrast: '7.24:1' },
  { id: 'deep-fuchsia',   label: 'Deep Fuchsia',            hex: '#AC006E', textColor: '#FFFFFF', contrast: '7.04:1' },
]

// Combined 16 Vivid Swatches
export const VIVID_SWATCHES = [...DARK_TEXT_SWATCHES, ...WHITE_TEXT_SWATCHES]

export const DEFAULT_SWATCH_HEX = '#E0E7FF'

// Backward-compatible alias for older components
export const M3_CONTENT_PALETTE = VIVID_SWATCHES.map(item => ({
  ...item,
  accent: item.hex,
  container: item.hex,
  onContainer: item.textColor,
}))

/**
 * Resolves color token. Returns null if uncolored so DayCell uses default Indigo Glow (#EEF2FF).
 */
export function getColorToken(colorOrId) {
  if (!colorOrId) return null

  const clean = String(colorOrId).toLowerCase().trim()

  // 1. Direct ID match
  const byId = VIVID_SWATCHES.find(item => item.id.toLowerCase() === clean)
  if (byId) {
    return {
      ...byId,
      text: byId.textColor,
      accent: byId.hex,
      container: byId.hex,
      onContainer: byId.textColor,
    }
  }

  // 2. Direct Hex match
  const byHex = VIVID_SWATCHES.find(item => item.hex.toLowerCase() === clean)
  if (byHex) {
    return {
      ...byHex,
      text: byHex.textColor,
      accent: byHex.hex,
      container: byHex.hex,
      onContainer: byHex.textColor,
    }
  }

  // Fallback for custom hex values
  const isLight = clean === '#e0e7ff' || clean.startsWith('#e') || clean.startsWith('#f')
  const fallbackTextColor = isLight ? '#1E1B4B' : '#FFFFFF'

  return {
    id: clean,
    label: 'Custom',
    hex: colorOrId,
    textColor: fallbackTextColor,
    text: fallbackTextColor,
    accent: colorOrId,
    container: colorOrId,
    onContainer: fallbackTextColor,
  }
}