// src/components/Search.jsx
import { useState, useMemo, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { truncateNote } from '../utils/notePreview'
import { getColorToken } from '../utils/m3Palette'

function formatDate(dateKey) {
  return new Date(dateKey + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  })
}

// M3 High-Contrast Highlight Token (Amber Container #FFE08B + On-Amber #241A00)
function highlight(text, query) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-[#FFE08B] text-[#241A00] font-bold rounded-sm px-1">{part}</mark>
      : part
  )
}

export default function Search({ entries, events, categories, onSelectDate }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const trimmed = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!trimmed) return []

    const matched = {}

    Object.entries(entries).forEach(([dateKey, entry]) => {
      if (entry.note?.toLowerCase().includes(trimmed)) {
        matched[dateKey] = { ...entry, matchedEvents: [] }
      }
    })

    events.forEach(event => {
      if (event.title.toLowerCase().includes(trimmed)) {
        if (!matched[event.date]) {
          matched[event.date] = {
            ...entries[event.date],
            matchedEvents: [event]
          }
        } else {
          matched[event.date].matchedEvents.push(event)
        }
      }
    })

    return Object.entries(matched).sort(([a], [b]) => b.localeCompare(a))
  }, [trimmed, entries, events])

  return (
    <section aria-label="Search diary" className="flex flex-col">

      {/* M3 Search Bar Container */}
      <div className="relative mb-4">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#45464F]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search notes, tags, and events..."
          aria-label="Search notes and events"
          className="w-full h-14 pl-12 pr-12 rounded-full border border-black/10 bg-[#EEF2FF] text-[#1E1B4B] text-md  placeholder-[#45464F] shadow-sm focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 focus:bg-white transition"
        />

        {/* Clear Search Button (48x48dp touch target) */}
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search text"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-[#1E1B4B] hover:bg-black/5 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results Count */}
      {trimmed && (
        <p className="text-xs font-bold text-[#1E1B4B] mb-3 select-none" aria-live="polite" aria-atomic="true">
          {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{query.trim()}&rdquo;
        </p>
      )}

      {/* Initial Empty State */}
      {!trimmed && (
        <div className="bg-[#FAF8FF] rounded-3xl p-8 text-center border border-black/5 shadow-xs flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center text-xl text-[#45464F]">
            🔍
          </div>
          <p className="text-sm font-bold text-[#1E1B4B]">Search Your Diary</p>
          <p className="text-xs text-[#45464F]">Type keywords to find entries, categories, or events.</p>
        </div>
      )}

      {/* No Results Found */}
      {trimmed && results.length === 0 && (
        <div className="bg-[#FAF8FF] rounded-3xl p-8 text-center border border-black/5 shadow-xs flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center text-xl text-[#45464F]">
            📭
          </div>
          <p className="text-sm font-bold text-[#1E1B4B]">No results found</p>
          <p className="text-xs text-[#45464F]">Try checking for typos or searching a different term.</p>
        </div>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <ul className="flex flex-col gap-3" aria-label="Search results">
          {results.map(([dateKey, entry]) => {
            const cat = categories.find(c => c.id === entry?.category)
            const catToken = cat ? getColorToken(cat.color) : null
            const { text: notePreview, truncated: noteTruncated } = truncateNote(entry?.note)

            return (
              <li key={dateKey}>
                <button
                  onClick={() => onSelectDate(dateKey)}
                  aria-label={`Open entry for ${formatDate(dateKey)}`}
                  className="w-full text-left bg-[#EEF2FF] hover:bg-white active:scale-98 rounded-2xl p-4 shadow-sm border border-black/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]"
                >
                  {/* Card Header */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {catToken && (
                      <span
                        className="w-2.5 h-2.5 rounded-full ring-1 ring-white flex-shrink-0"
                        style={{ backgroundColor: catToken.accent }}
                        aria-hidden="true"
                      />
                    )}
                    <time dateTime={dateKey} className="text-xs font-bold text-[#1E1B4B]">
                      {formatDate(dateKey)}
                    </time>
                    {cat && (
                      <span className="text-xs font-semibold text-[#45464F]">
                        &middot; {cat.label}
                      </span>
                    )}
                  </div>

                  {/* Highlighted Note Text */}
                  {entry?.note && (
                    <div className="pl-4 border-l-2 border-[#1E1B4B]/20 mb-2">
                      <p className="text-sm font-medium text-[#1E1B4B] whitespace-pre-line leading-relaxed">
                        {highlight(notePreview, query.trim())}
                      </p>
                      {noteTruncated && (
                        <span className="inline-block mt-1 text-xs font-bold text-[#4F46E5]">
                          Read full entry →
                        </span>
                      )}
                    </div>
                  )}

                  {/* Matched Events */}
                  {entry?.matchedEvents?.length > 0 && (
                    <ul className="pl-4 flex flex-col gap-1.5" aria-label="Matched events">
                      {entry.matchedEvents.map(event => {
                        const evToken = getColorToken(event.color)
                        return (
                          <li
                            key={event.id}
                            className="flex items-center gap-2 text-xs font-semibold text-[#45464F]"
                          >
                            <span
                              className="w-2 h-2 rounded-full ring-1 ring-white"
                              style={{ backgroundColor: evToken ? evToken.accent : event.color }}
                              aria-hidden="true"
                            />
                            <span>{highlight(event.title, query.trim())}</span>
                          </li>
                        )
                      })}
                    </ul>
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

Search.propTypes = {
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
  onSelectDate: PropTypes.func.isRequired,
}