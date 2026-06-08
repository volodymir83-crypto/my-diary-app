import { useState, useMemo, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'



function formatDate(dateKey) {
  return new Date(dateKey + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  })
}

function highlight(text, query) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark>
      : part
  )
}

export default function Search({ entries, events, categories, onSelectDate }) {
  const [query, setQuery] = useState('')

  const trimmed = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!trimmed) return []

    const matched = {}

    // search through notes
    Object.entries(entries).forEach(([dateKey, entry]) => {
      if (entry.note?.toLowerCase().includes(trimmed)) {
        matched[dateKey] = { ...entry, matchedEvents: [] }
      }
    })

    // search through event titles
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

    return Object.entries(matched)
      .sort(([a], [b]) => b.localeCompare(a)) // newest first
  }, [trimmed, entries, events])

const inputRef = useRef(null)
useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <section aria-label="Search diary">

      {/* Search input */}
      <div className="relative mb-4">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        >
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search notes and events..."
          aria-label="Search notes and events"
          ref={inputRef}
className="w-full rounded-xl border border-gray-300 pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results count */}
      {trimmed && (
        <p className="text-xs text-gray-500 mb-3" aria-live="polite" aria-atomic="true">
          {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{query.trim()}&rdquo;
        </p>
      )}

      {/* Empty states */}
      {!trimmed && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2" aria-hidden="true">🔍</p>
          <p className="text-sm">Start typing to search your diary</p>
        </div>
      )}

      {trimmed && results.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2" aria-hidden="true">📭</p>
          <p className="text-sm">No results found</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <ul className="flex flex-col gap-3" aria-label="Search results">
          {results.map(([dateKey, entry]) => {
            const cat = categories.find(c => c.id === entry?.category)
            return (
              <li key={dateKey}>
                <button
                  onClick={() => onSelectDate(dateKey)}
                  aria-label={`Open entry for ${formatDate(dateKey)}`}
                  className="w-full text-left bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:border-blue-300 active:bg-gray-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {/* Date + category */}
                  <div className="flex items-center gap-2 mb-1">
                    {cat && (
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden="true"
                      />
                    )}
                    <time dateTime={dateKey} className="text-xs font-medium text-gray-500">
                      {formatDate(dateKey)}
                    </time>
                    {cat && (
                      <span className="text-xs text-gray-400">· {cat.label}</span>
                    )}
                  </div>

                  {/* Note with highlighted match */}
                  {entry?.note && (
                    <p className="text-sm text-gray-700 line-clamp-2 ml-5">
                      {highlight(entry.note, query.trim())}
                    </p>
                  )}

                  {/* Matched events */}
                  {entry?.matchedEvents?.length > 0 && (
                    <ul className="mt-1.5 ml-5 flex flex-col gap-1" aria-label="Matched events">
                      {entry.matchedEvents.map(event => (
                        <li
                          key={event.id}
                          className="flex items-center gap-1.5 text-xs text-gray-500"
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: event.color }}
                            aria-hidden="true"
                          />
                          {highlight(event.title, query.trim())}
                        </li>
                      ))}
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