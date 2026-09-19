// src/utils/colorUsage.js
import { getColorToken } from './m3Palette'

// Returns a Set of every color token ID and hex representation currently assigned
// to a category, a manually highlighted entry, or an event.
// This prevents duplicate colors while remaining compatible with legacy data.
export function getUsedColors({ categories = [], entries = {}, events = [], excludeDateKey }) {
  const used = new Set()

  function markUsed(colorValue) {
    if (!colorValue) return

    // Register raw value (handles custom or legacy hex)
    used.add(colorValue)
    used.add(colorValue.toLowerCase())

    // Resolve M3 token and register both id and hex variations
    const token = getColorToken(colorValue)
    if (token) {
      used.add(token.id)
      if (token.accent) {
        used.add(token.accent)
        used.add(token.accent.toLowerCase())
      }
      if (token.container) {
        used.add(token.container)
        used.add(token.container.toLowerCase())
      }
    }
  }

  categories.forEach(cat => markUsed(cat.color))

  Object.entries(entries).forEach(([dateKey, entry]) => {
    if (dateKey === excludeDateKey) return
    // Only count manually picked highlight colors — category-derived
    // colors are already accounted for by the categories loop above.
    if (!entry.category && entry.color) {
      markUsed(entry.color)
    }
  })

  events.forEach(event => markUsed(event.color))

  return used
}