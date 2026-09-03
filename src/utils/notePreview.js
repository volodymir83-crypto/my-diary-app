const NOTE_LINE_LIMIT = 10

// Splits a note on explicit line breaks and caps it at NOTE_LINE_LIMIT lines.
// Truncation is based on the lines the user actually typed (via Enter), not
// on however the text happens to visually wrap on screen.
export function truncateNote(note) {
  if (!note) return { text: '', truncated: false }
  const lines = note.split('\n')
  const truncated = lines.length > NOTE_LINE_LIMIT
  const text = truncated ? lines.slice(0, NOTE_LINE_LIMIT).join('\n') : note
  return { text, truncated }
}