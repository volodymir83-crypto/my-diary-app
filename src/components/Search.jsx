// src/components/Search.jsx
import { useState, useMemo, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { truncateNote } from '../utils/notePreview'
import { getColorToken } from '../utils/m3Palette'

function formatDate(dateKey) {
  return new Date(dateKey + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// M3 High-Contrast Highlight Token (Amber Container #FFE08B + On-Amber #241A00)
function highlight(text, query) {
  if (!query || !text) return text
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-[#FFE08B] text-[#241A00] font-bold rounded-sm px-1">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export default function Search({
  notes = [],
  events = [],
  entries = {},
  onSelectDate,
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const trimmed = query.trim().toLowerCase()

  // Universal Search across: Action Titles, Action Descriptions, Note Titles, Note Content
  const results = useMemo(() => {
    if (!trimmed) return []

    const matched = {}

    function getOrCreateDateGroup(dateKey) {
      if (!matched[dateKey]) {
        matched[dateKey] = {
          date: dateKey,
          matchedEvents: [],
          matchedNotes: [],
          legacyNote: null,
        }
      }
      return matched[dateKey]
    }

    // 1. Scan Events (Activity Titles & Session Descriptions)
    events.forEach((event) => {
      const titleMatch = event.title?.toLowerCase().includes(trimmed)
      const descMatch = event.description?.toLowerCase().includes(trimmed)

      if (titleMatch || descMatch) {
        const group = getOrCreateDateGroup(event.date)
        group.matchedEvents.push({
          ...event,
          matchedOnTitle: titleMatch,
          matchedOnDesc: descMatch,
        })
      }
    })

    // 2. Scan Multi-Notes (Titles & Body Content)
    notes.forEach((note) => {
      const titleMatch = note.title?.toLowerCase().includes(trimmed)
      const contentMatch = note.content?.toLowerCase().includes(trimmed)

      if (titleMatch || contentMatch) {
        const group = getOrCreateDateGroup(note.date)
        group.matchedNotes.push({
          ...note,
          matchedOnTitle: titleMatch,
          matchedOnContent: contentMatch,
        })
      }
    })

    // 3. Scan Legacy Entries
    Object.entries(entries).forEach(([dateKey, entry]) => {
      if (entry?.note?.toLowerCase().includes(trimmed)) {
        const group = getOrCreateDateGroup(dateKey)
        const alreadyCovered = group.matchedNotes.some((n) => n.content === entry.note)
        if (!alreadyCovered) {
          group.legacyNote = entry.note
        }
      }
    })

    // Sort matching dates descending (newest first)
    return Object.values(matched).sort((a, b) => b.date.localeCompare(a.date))
  }, [trimmed, events, notes, entries])

  return (
    <section aria-label="Search diary" className="flex flex-col select-none font-sans">
      {/* M3 Search Bar Container */}
      <div className="relative mb-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#45464F]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" strokeWidth={2} />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} strokeLinecap="round" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search activities, descriptions, or notes..."
          aria-label="Search activities, descriptions, or notes"
          className="w-full h-14 pl-12 pr-12 rounded-full border border-black/10 bg-[#EEF2FF] text-[#1E1B4B] text-sm font-semibold placeholder-[#45464F] shadow-sm focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 focus:bg-white transition"
        />

        {query && (
          <button
            type="button"
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

      {/* Results Count Indicator */}
      {trimmed && (
        <p className="text-xs font-bold text-[#1E1B4B] mb-3 select-none" aria-live="polite" aria-atomic="true">
          {results.length} {results.length === 1 ? 'day match' : 'day matches'} for &ldquo;{query.trim()}&rdquo;
        </p>
      )}

      {/* Initial Empty State */}
      {!trimmed && (
        <div className="bg-[#FAF8FF] rounded-3xl p-8 text-center border border-black/5 shadow-xs flex flex-col items-center justify-center gap-2">
          <div className="w-14 h-14 rounded-full bg-[#C7D2FE]/30 text-[#4F46E5] flex items-center justify-center mb-1">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" strokeWidth={2} />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#1E1B4B]">Search Your Diary</p>
          <p className="text-xs text-[#45464F]">
            Type keywords to find activities, workout notes, or session descriptions.
          </p>
        </div>
      )}

      {/* No Results Found */}
      {trimmed && results.length === 0 && (
        <div className="bg-[#FAF8FF] rounded-3xl p-8 text-center border border-black/5 shadow-xs flex flex-col items-center justify-center gap-2">
          <div className="w-14 h-14 rounded-full bg-[#C7D2FE]/30 text-[#4F46E5] flex items-center justify-center mb-1">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#1E1B4B]">No results found</p>
          <p className="text-xs text-[#45464F]">Try checking for typos or searching a different term.</p>
        </div>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <ul className="flex flex-col gap-3" aria-label="Search results">
          {results.map((group) => (
            <li key={group.date}>
              <button
                type="button"
                onClick={() => onSelectDate(group.date)}
                aria-label={`Open entry for ${formatDate(group.date)}`}
                className="w-full text-left bg-[#EEF2FF] hover:bg-white active:scale-98 rounded-2xl p-4 shadow-sm border border-black/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B] flex flex-col gap-2.5"
              >
                {/* Date Header */}
                <div className="flex items-center justify-between w-full border-b border-black/5 pb-2">
                  <time dateTime={group.date} className="text-xs font-bold text-[#1E1B4B]">
                    {formatDate(group.date)}
                  </time>
                  <span className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider">
                    Open in Calendar &rarr;
                  </span>
                </div>

                {/* 1. Matched Activities & Descriptions */}
                {group.matchedEvents.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[#45464F] uppercase tracking-wider">
                      Activities ({group.matchedEvents.length}):
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {group.matchedEvents.map((ev) => {
                        const token = getColorToken(ev.color)
                        return (
                          <div
                            key={ev.id}
                            className="bg-white p-2.5 rounded-xl border border-black/5 shadow-2xs flex flex-col gap-1"
                          >
                            <span
                              className="w-fit px-2 py-0.5 rounded text-[11px] font-bold shadow-2xs"
                              style={{
                                backgroundColor: token ? token.hex : '#4F46E5',
                                color: token ? token.textColor : '#FFFFFF',
                              }}
                            >
                              {highlight(ev.title, trimmed)}
                            </span>
                            {ev.description && (
                              <p className="text-xs font-medium text-[#1E1B4B] whitespace-pre-wrap pl-1 border-l-2 border-[#1E1B4B]/20">
                                {highlight(ev.description, trimmed)}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Matched Journal Notes */}
                {group.matchedNotes.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-[#45464F] uppercase tracking-wider">
                      Journal Notes ({group.matchedNotes.length}):
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {group.matchedNotes.map((nt) => {
                        const { text: notePreview } = truncateNote(nt.content)
                        return (
                          <div
                            key={nt.id}
                            className="bg-white p-2.5 rounded-xl border border-black/5 shadow-2xs flex flex-col gap-1"
                          >
                            {nt.title && (
                              <h4 className="text-xs font-bold text-[#1E1B4B]">
                                {highlight(nt.title, trimmed)}
                              </h4>
                            )}
                            <p className="text-xs font-medium text-[#45464F] whitespace-pre-line pl-1 border-l-2 border-[#4F46E5]/30">
                              {highlight(notePreview, trimmed)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Matched Legacy Note */}
                {group.legacyNote && (
                  <div className="bg-white p-2.5 rounded-xl border border-black/5 shadow-2xs">
                    <p className="text-xs font-medium text-[#45464F] whitespace-pre-line">
                      {highlight(truncateNote(group.legacyNote).text, trimmed)}
                    </p>
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

Search.propTypes = {
  
  notes:        PropTypes.arrayOf(PropTypes.object),
  events:       PropTypes.arrayOf(PropTypes.object),
  entries:      PropTypes.objectOf(PropTypes.object),
  onSelectDate: PropTypes.func.isRequired,
}