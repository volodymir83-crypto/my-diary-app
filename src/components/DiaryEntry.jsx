// src/components/DiaryEntry.jsx
import { useState } from 'react'
import PropTypes from 'prop-types'
import { getUsedColors } from '../utils/colorUsage'
import { M3_CONTENT_PALETTE, getColorToken } from '../utils/m3Palette'

export default function DiaryEntry({
  dateKey, entry, entries, events, categories,
  onSave, onDelete, onAddEvent, onDeleteEvent, onClose
}) {
  const existingColorToken = getColorToken(entry?.color)

  const [note,               setNote]               = useState(entry?.note || '')
  const [colorId,            setColorId]            = useState(existingColorToken?.id || null)
  const [category,            setCategory]           = useState(entry?.category || null)
  const [eventTitle,          setEventTitle]         = useState('')
  const [selectedEventColorId, setSelectedEventColorId] = useState(null)

  const dayEvents = events.filter(e => e.date === dateKey)

  // Exclude this date's own color so it remains selectable while editing
  const usedColors = getUsedColors({ categories, entries, events, excludeDateKey: dateKey })

  // Available M3 colors for manual highlight
  const availableEntryColors = M3_CONTENT_PALETTE.filter(
    c => c.id === colorId || !usedColors.has(c.id)
  )

  // Available M3 colors for events
  const availableEventColors = M3_CONTENT_PALETTE.filter(
    c => !usedColors.has(c.id)
  )

  const eventColorId = selectedEventColorId && availableEventColors.some(c => c.id === selectedEventColorId)
    ? selectedEventColorId
    : availableEventColors[0]?.id ?? null

  const formattedDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  function handleCategoryChange(val) {
    if (!val) {
      setCategory(null)
      setColorId(null)
    } else {
      const cat = categories.find(c => c.id === val)
      setCategory(val)
      const catToken = getColorToken(cat.color)
      setColorId(catToken?.id || cat.color)
    }
  }

  function handleSave() {
    onSave(dateKey, note, colorId, category)
    onClose()
  }

  function handleDelete() {
    onDelete(dateKey)
    onClose()
  }

  function handleAddEvent() {
    if (!eventTitle.trim() || !eventColorId) return
    onAddEvent(dateKey, eventTitle.trim(), eventColorId)
    setEventTitle('')
    setSelectedEventColorId(null)
  }

  const activeCategory = categories.find(c => c.id === category)
  const activeCatToken = activeCategory ? getColorToken(activeCategory.color) : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Diary entry for ${formattedDate}`}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-2 sm:p-4"
    >
      {/* M3 Modal Bottom Sheet */}
      <div className="bg-[#FAF8FF] rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl border border-black/5 flex flex-col">

        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 sticky top-0 bg-[#FAF8FF]/90 backdrop-blur-md z-10">
          <div>
            <h2 className="text-base font-bold text-[#1E1B4B] tracking-tight">{formattedDate}</h2>
            <p className="text-xs font-medium text-[#45464F]">Note &amp; Highlights</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-12 h-12 flex items-center justify-center rounded-full text-[#1E1B4B] hover:bg-black/5 active:bg-black/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6">

          {/* Workout Category Selector */}
          <section aria-labelledby="category-label" className="flex flex-col gap-2">
            <label
              id="category-label"
              htmlFor="workout-category"
              className="text-xs font-bold uppercase tracking-wider text-[#45464F]"
            >
              Workout Category
            </label>
            <div className="relative">
              <select
                id="workout-category"
                value={category || ''}
                onChange={e => handleCategoryChange(e.target.value || null)}
                className="w-full h-12 rounded-2xl border border-[#767680]/30 bg-white px-4 text-sm font-medium text-[#1E1B4B] appearance-none focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 shadow-xs transition"
              >
                <option value="">— None —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <span
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#45464F] text-xs font-bold"
                aria-hidden="true"
              >
                ▼
              </span>
            </div>
            {activeCatToken && (
              <div
                className="mt-1 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: activeCatToken.container, color: activeCatToken.onContainer }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activeCatToken.accent }}
                  aria-hidden="true"
                />
                <span>Highlighted in {activeCategory.label} ({activeCatToken.label})</span>
              </div>
            )}
          </section>

          {/* Manual Highlight Palette — Hidden when Category is active */}
          {!category && (
            <section aria-labelledby="color-label" className="flex flex-col gap-2">
              <p id="color-label" className="text-xs font-bold uppercase tracking-wider text-[#45464F]">
                Highlight Color
              </p>
              <div className="flex gap-1 flex-wrap" role="radiogroup" aria-labelledby="color-label">
                {/* None Option */}
                <div className="w-12 h-12 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setColorId(null)}
                    aria-label="No highlight"
                    role="radio"
                    aria-checked={colorId === null}
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                      colorId === null
                        ? 'border-[#4F46E5] bg-white ring-2 ring-[#4F46E5]/30 scale-105'
                        : 'border-dashed border-[#767680] bg-transparent hover:scale-105'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#45464F] leading-none">✕</span>
                  </button>
                </div>

                {/* Available M3 Swatches */}
                {availableEntryColors.map(c => {
                  const isSelected = colorId === c.id
                  return (
                    <div key={c.id} className="w-12 h-12 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setColorId(c.id)}
                        aria-label={`${c.label} highlight`}
                        role="radio"
                        aria-checked={isSelected}
                        className={`w-9 h-9 rounded-full transition-all flex items-center justify-center shadow-xs ${
                          isSelected
                            ? 'ring-3 ring-offset-2 ring-[#4F46E5] scale-110'
                            : 'hover:scale-105 border border-black/10'
                        }`}
                        style={{ backgroundColor: c.accent }}
                      >
                        {isSelected && (
                          <svg className="w-4 h-4 text-white drop-shadow-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Notes Input */}
          <section aria-labelledby="notes-label" className="flex flex-col gap-2">
            <label
              id="notes-label"
              htmlFor="diary-note"
              className="text-xs font-bold uppercase tracking-wider text-[#45464F]"
            >
              Notes
            </label>
            <textarea
              id="diary-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What happened today?..."
              rows={4}
              className="w-full rounded-2xl border border-[#767680]/30 bg-white p-3.5 text-sm font-medium text-[#1E1B4B] placeholder-[#767680] resize-none focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 shadow-xs transition"
            />
          </section>

          {/* Main Actions (M3 Filled + Error Buttons) */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 h-12 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-98 text-white font-bold rounded-full text-sm shadow-sm transition flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4F46E5]"
            >
              Save Entry
            </button>
            {entry && (
              <button
                onClick={handleDelete}
                aria-label="Delete this diary entry"
                className="h-12 px-6 bg-[#FFDAD6] hover:bg-[#FFB4AB] active:scale-98 text-[#410002] font-bold rounded-full text-sm transition flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BA1A1A]"
              >
                Delete
              </button>
            )}
          </div>

          {/* Event Tags Section */}
          <section aria-labelledby="events-label" className="border-t border-black/5 pt-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 id="events-label" className="text-xs font-bold uppercase tracking-wider text-[#45464F]">
                Events &amp; Tags
              </h3>
              <span className="text-xs font-semibold text-[#45464F]">
                {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>

            {dayEvents.length > 0 && (
              <ul aria-label="Events for this day" className="flex flex-col gap-2">
                {dayEvents.map(event => {
                  const evToken = getColorToken(event.color)
                  return (
                    <li
                      key={event.id}
                      className="flex items-center justify-between rounded-2xl px-4 py-2 border border-black/5 shadow-xs transition"
                      style={{
                        backgroundColor: evToken ? evToken.container : '#EEF2FF',
                        color: evToken ? evToken.onContainer : '#1E1B4B',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full ring-1 ring-white"
                          style={{ backgroundColor: evToken ? evToken.accent : event.color }}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-semibold">{event.title}</span>
                      </div>
                      <button
                        onClick={() => onDeleteEvent(event.id)}
                        aria-label={`Delete event: ${event.title}`}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BA1A1A]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* Add Event Input & Palette */}
            <div className="flex flex-col gap-3 bg-white p-3.5 rounded-2xl border border-black/5 shadow-xs">
              <input
                type="text"
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                placeholder="New event title..."
                aria-label="New event title"
                className="w-full h-11 rounded-xl border border-[#767680]/30 px-3.5 text-sm font-medium text-[#1E1B4B] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20"
              />

              {availableEventColors.length > 0 ? (
                <div className="flex gap-1 flex-wrap" role="radiogroup" aria-label="Event color selector">
                  {availableEventColors.map(c => {
                    const isSelected = eventColorId === c.id
                    return (
                      <div key={c.id} className="w-10 h-10 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setSelectedEventColorId(c.id)}
                          aria-label={`${c.label} event color`}
                          role="radio"
                          aria-checked={isSelected}
                          className={`w-7 h-7 rounded-full transition-all flex items-center justify-center shadow-xs ${
                            isSelected
                              ? 'ring-2 ring-offset-2 ring-[#4F46E5] scale-110'
                              : 'hover:scale-105 border border-black/10'
                          }`}
                          style={{ backgroundColor: c.accent }}
                        >
                          {isSelected && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs font-medium text-[#BA1A1A]">
                  All event colors are currently claimed.
                </p>
              )}

              <button
                onClick={handleAddEvent}
                disabled={!eventTitle.trim() || !eventColorId}
                className="w-full h-11 bg-[#EEF2FF] hover:bg-[#C7D2FE] active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed text-[#1E1B4B] font-bold rounded-xl text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
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