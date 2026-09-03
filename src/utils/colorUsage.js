// Returns a Set of every color currently assigned to a category, a manually
// highlighted entry, or an event — used to keep colors unique across the app.
export function getUsedColors({ categories, entries, events, excludeDateKey }) {
  const used = new Set()

  categories.forEach(cat => used.add(cat.color))

  Object.entries(entries).forEach(([dateKey, entry]) => {
    if (dateKey === excludeDateKey) return
    // Only count manually picked highlight colors — category-derived
    // colors are already covered by the categories loop above.
    if (!entry.category && entry.color) used.add(entry.color)
  })

  events.forEach(event => used.add(event.color))

  return used
}