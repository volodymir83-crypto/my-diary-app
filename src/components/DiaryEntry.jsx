import { useState } from 'react'
import PropTypes from 'prop-types'
import { getUsedColors } from '../utils/colorUsage'

const ENTRY_COLORS = [
  { label: 'None',   value: null,      bg: 'bg-white border-2 border-gray-300' },
  { label: 'Yellow', value: '#fde68a', bg: 'bg-yellow-200' },
  { label: 'Green',  value: '#bbf7d0', bg: 'bg-green-200' },
  { label: 'Blue',   value: '#bfdbfe', bg: 'bg-blue-200' },
  { label: 'Pink',   value: '#fbcfe8', bg: 'bg-pink-200' },
  { label: 'Purple', value: '#e9d5ff', bg: 'bg-purple-200' },
  { label: 'Orange', value: '#fed7aa', bg: 'bg-orange-200' },
]

const EVENT_COLORS = [
  { label: 'Red',    value: '#f87171' },
  { label: 'Orange', value: '#fbbf24' },
  { label: 'Yellow', value: '#facc15' },
  { label: 'Green',  value: '#4ade80' },
  { label: 'Teal',   value: '#2dd4bf' },
  { label: 'Cyan',   value: '#22d3ee' },
  { label: 'Blue',   value: '#60a5fa' },
  { label: 'Indigo', value: '#818cf8' },
  { label: 'Purple', value: '#a78bfa' },
  { label: 'Pink',   value: '#f472b6' },
]

export default function DiaryEntry({
  dateKey, entry, entries, events, categories,
  onSave, onDelete, onAddEvent, onDeleteEvent, onClose
}) {
  const [note,               setNote]               = useState(entry?.note     || '')
  const [color,               setColor]              = useState(entry?.color    || null)
  const [category,            setCategory]           = useState(entry?.category || null)
  const [eventTitle,          setEventTitle]         = useState('')
  const [selectedEventColor,  setSelectedEventColor] = useState(null)

  const dayEvents = events.filter(e => e.date === dateKey)

  // Colors already claimed by a category, a manually-highlighted note, or an
  // event elsewhere in the app. This entry's own saved color is excluded so
  // it doesn't vanish from the list while you're still editing it.
  const usedColors = getUsedColors({ categories, entries, events, excludeDateKey: dateKey })

  const availableEntryColors = ENTRY_COLORS.filter(
    c => c.value === null || !usedColors.has(c.value)
  )
  const availableEventColors = EVENT_COLORS.filter(c => !usedColors.has(c.value))

  const eventColor = selectedEventColor && availableEventColors.some(c => c.value === selectedEventColor)
    ? selectedEventColor
    : availableEventColors[0]?.value ?? null

  const formattedDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  function handleCategoryChange(val) {
    if (!val) {
      setCategory(null)
      setColor(null)
    } else {
      const cat = categories.find(c => c.id === val)
      setCategory(val)
      setColor(cat.color)
    }
  }

  function handleSave() {
    onSave(dateKey, note, color, category)
    onClose()
  }

  function handleDelete() {
    onDelete(dateKey)
    onClose()
  }

  function handleAddEvent() {
    if (!eventTitle.trim() || !eventColor) return
    onAddEvent(dateKey, eventTitle.trim(), eventColor)
    setEventTitle('')
    setSelectedEventColor(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Diary entry for ${formattedDate}`}
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{formattedDate}</h2>
          <button
            onClick={onClose}
            aria-label="Close diary entry"
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex flex-col gap-5">

          {/* Workout category dropdown */}
          <section aria-labelledby="category-label">
            <label
              id="category-label"
              htmlFor="workout-category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Workout type
            </label>
            <div className="relative">
              <select
                id="workout-category"
                value={category || ''}
                onChange={e => handleCategoryChange(e.target.value || null)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
              >
                <option value="">— None —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <span
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              >
                ▾
              </span>
            </div>
            {category && (
              <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                Day will be highlighted in{' '}
                {categories.find(c => c.id === category)?.label} color
              </p>
            )}
          </section>

          {/* Manual highlight — hidden when category is selected */}
          {!category && (
            <section aria-labelledby="color-label">
              <p id="color-label" className="text-sm font-medium text-gray-700 mb-2">
                Highlight color
              </p>
              <div className="flex gap-2 flex-wrap" role="group" aria-labelledby="color-label">
                {availableEntryColors.map(c => (
                  <button
                    key={c.label}
                    onClick={() => setColor(c.value)}
                    aria-label={`${c.label} highlight${color === c.value ? ', selected' : ''}`}
                    aria-pressed={color === c.value}
                    className={[
                      'w-8 h-8 rounded-full transition',
                      c.bg,
                      color === c.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : '',
                    ].join(' ')}
                  />
                ))}
              </div>
              {availableEntryColors.length === 1 && (
                <p className="mt-2 text-xs text-amber-600">
                  Every highlight color is already used by a category, note, or event. Pick a workout type above, or free up a color elsewhere.
                </p>
              )}
            </section>
          )}

          {/* Notes */}
          <section aria-labelledby="notes-label">
            <label
              id="notes-label"
              htmlFor="diary-note"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes
            </label>
            <textarea
              id="diary-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Write about your day..."
              rows={4}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </section>

          {/* Save / Delete */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium rounded-xl py-2.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Save
            </button>
            {entry && (
              <button
                onClick={handleDelete}
                aria-label="Delete this diary entry"
                className="px-4 bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-600 font-medium rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Delete
              </button>
            )}
          </div>

          {/* Events */}
          <section aria-labelledby="events-label">
            <h3 id="events-label" className="text-sm font-medium text-gray-700 mb-2">
              Events
            </h3>
            {dayEvents.length > 0 && (
              <ul aria-label="Events for this day" className="flex flex-col gap-2 mb-3">
                {dayEvents.map(event => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-gray-800">{event.title}</span>
                    </div>
                    <button
                      onClick={() => onDeleteEvent(event.id)}
                      aria-label={`Delete event: ${event.title}`}
                      className="text-gray-400 hover:text-red-500 transition text-xs px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                placeholder="New event title..."
                aria-label="New event title"
                className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {availableEventColors.length > 0 ? (
                <div className="flex gap-2 items-center flex-wrap" role="group" aria-label="Event color">
                  {availableEventColors.map(c => (
                    <button
                      key={c.label}
                      onClick={() => setSelectedEventColor(c.value)}
                      aria-label={`${c.label} event color${eventColor === c.value ? ', selected' : ''}`}
                      aria-pressed={eventColor === c.value}
                      className={[
                        'w-7 h-7 rounded-full transition',
                        eventColor === c.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : '',
                      ].join(' ')}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-600">
                  Every event color is already in use. Delete a category, note highlight, or event to free one up.
                </p>
              )}
              <button
                onClick={handleAddEvent}
                disabled={!eventTitle.trim() || !eventColor}
                className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium rounded-xl py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                + Add Event
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

DiaryEntry.propTypes = {
  dateKey: PropTypes.string.isRequired,
  entry: PropTypes.shape({
    note:     PropTypes.string,
    color:    PropTypes.string,
    category: PropTypes.string,
  }),
  entries: PropTypes.objectOf(
    PropTypes.shape({
      note:     PropTypes.string,
      color:    PropTypes.string,
      category: PropTypes.string,
    })
  ).isRequired,
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id:    PropTypes.number.isRequired,
      date:  PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id:    PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSave:        PropTypes.func.isRequired,
  onDelete:      PropTypes.func.isRequired,
  onAddEvent:    PropTypes.func.isRequired,
  onDeleteEvent: PropTypes.func.isRequired,
  onClose:       PropTypes.func.isRequired,
}

DiaryEntry.defaultProps = {
  entry: null,
}