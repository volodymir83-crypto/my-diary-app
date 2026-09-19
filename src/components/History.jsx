// src/components/History.jsx
import { useState } from 'react'
import PropTypes from 'prop-types'
import { truncateNote } from '../utils/notePreview'
import { getColorToken } from '../utils/m3Palette'

function formatDate(dateKey) {
  return new Date(dateKey + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  })
}

function daysBetween(dateKeyA, dateKeyB) {
  const a = new Date(dateKeyA + 'T00:00:00')
  const b = new Date(dateKeyB + 'T00:00:00')
  return Math.round((a - b) / (1000 * 60 * 60 * 24))
}

export default function History({ entries, categories, onSelectDate }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')

  const activeCategory = categories.find(c => c.id === categoryId)
  const activeToken = activeCategory ? getColorToken(activeCategory.color) : null

  const filtered = Object.entries(entries)
    .filter(([, entry]) => entry.category === categoryId)
    .sort(([a], [b]) => b.localeCompare(a))

  return (
    <section aria-label="Workout history" className="flex flex-col">

      {/* M3 Filter Chips Carousel with Bleed Padding (No Border Clipping) */}
      <div
        role="tablist"
        aria-label="Workout categories"
        className="-mx-4 px-4 flex gap-2.5 mb-3 overflow-x-auto no-scrollbar py-2 items-center"
      >
        {categories.map(c => {
          const isSelected = categoryId === c.id
          const token = getColorToken(c.color)

          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setCategoryId(c.id)}
              className={`flex-shrink-0 h-12 min-w-[5.5rem] px-4 rounded-2xl text-xs font-bold tracking-wide transition-all duration-150 flex items-center justify-center gap-2 shadow-xs border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B] active:scale-95 ${
                isSelected
                  ? 'border-black/15 shadow-sm ring-2 ring-[#1E1B4B]/20'
                  : 'bg-[#EEF2FF] text-[#1E1B4B] border-black/5 hover:bg-white'
              }`}
              style={
                isSelected && token
                  ? {
                      backgroundColor: token.container,
                      color: token.onContainer,
                    }
                  : undefined
              }
            >
              <span
                className="w-2.5 h-2.5 rounded-full ring-1 ring-white/80 shadow-xs flex-shrink-0"
                style={{ backgroundColor: token ? token.accent : c.color }}
                aria-hidden="true"
              />
              <span>{c.label}</span>
            </button>
          )
        })}
      </div>

      {/* Counter Label */}
      <p className="text-xs font-bold text-[#1E1B4B] mb-3 select-none" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} found
      </p>

      {/* Empty State with Vector SVG Icon */}
      {filtered.length === 0 ? (
        <div className="bg-[#FAF8FF] rounded-3xl p-8 text-center border border-black/5 shadow-xs flex flex-col items-center justify-center gap-2">
          <div className="w-14 h-14 rounded-full bg-[#C7D2FE]/30 text-[#4F46E5] flex items-center justify-center mb-1">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#1E1B4B]">No {activeCategory?.label || 'workout'} entries yet</p>
          <p className="text-xs text-[#45464F]">Select dates on the calendar to log this workout.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label={`${activeCategory?.label} entries`}>
          {filtered.map(([dateKey, entry], index) => {
            const previousDateKey = index + 1 < filtered.length ? filtered[index + 1][0] : null
            const daysSincePrevious = previousDateKey ? daysBetween(dateKey, previousDateKey) : null
            const { text: notePreview, truncated: noteTruncated } = truncateNote(entry.note)

            return (
              <li key={dateKey}>
                <button
                  onClick={() => onSelectDate(dateKey)}
                  aria-label={`Open entry for ${formatDate(dateKey)}${daysSincePrevious !== null ? `, ${daysSincePrevious} day${daysSincePrevious === 1 ? '' : 's'} since previous entry` : ''}`}
                  className="w-full text-left bg-[#EEF2FF] hover:bg-white active:scale-98 rounded-2xl p-4 shadow-sm border border-black/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]"
                >
                  {/* Card Header: Category Badge + Date + Interval */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="w-2.5 h-2.5 rounded-full ring-1 ring-white/80 flex-shrink-0"
                      style={{ backgroundColor: activeToken ? activeToken.accent : activeCategory?.color }}
                      aria-hidden="true"
                    />
                    <time dateTime={dateKey} className="text-xs font-bold text-[#1E1B4B]">
                      {formatDate(dateKey)}
                    </time>
                    {daysSincePrevious !== null && (
                      <span className="text-xs font-semibold text-[#45464F]">
                        &middot; {daysSincePrevious} {daysSincePrevious === 1 ? 'day' : 'days'} since last
                      </span>
                    )}
                    
                  </div>

                  {/* Note Preview */}
                  {entry.note ? (
                    <div className="pl-4 border-l-2 border-[#1E1B4B]/20">
                      <p className="text-sm font-medium text-[#1E1B4B] whitespace-pre-line leading-relaxed">
                        {notePreview}
                      </p>
                      {noteTruncated && (
                        <span className="inline-block mt-1 text-xs font-bold text-[#4F46E5]">
                          Read full entry 
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-[#45464F] italic pl-4">No notes logged for this day</p>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

    </section>
  )
}

History.propTypes = {
  entries: PropTypes.objectOf(
    PropTypes.shape({
      note:     PropTypes.string,
      color:    PropTypes.string,
      category: PropTypes.string,
    })
  ).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id:    PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelectDate: PropTypes.func.isRequired,
}