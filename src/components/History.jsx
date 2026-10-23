// src/components/History.jsx
import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { getColorToken } from '../utils/m3Palette'


function formatDate(dateKey) {
  return new Date(dateKey + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function daysBetween(dateKeyA, dateKeyB) {
  const a = new Date(dateKeyA + 'T00:00:00')
  const b = new Date(dateKeyB + 'T00:00:00')
  return Math.round((a - b) / (1000 * 60 * 60 * 24))
}

export default function History({
  events = [],
  actions = [],
  entries = {},
  categories = [],
  onSelectDate,
}) {
  // Normalize action list across new actions and legacy categories
  const actionList = useMemo(() => {
    if (actions && actions.length > 0) return actions
    if (categories && categories.length > 0) {
      return categories.map((c) => ({ id: c.id, name: c.label, color: c.color }))
    }
    return []
  }, [actions, categories])

  const [selectedActionId, setSelectedActionId] = useState(actionList[0]?.id || '')

  const activeAction = useMemo(() => {
    return actionList.find((a) => a.id === selectedActionId) || actionList[0]
  }, [actionList, selectedActionId])



  // Filter logged events for this action (with fallback to legacy entries)
  const displayItems = useMemo(() => {
    if (!activeAction) return []

    // 1. Check logged day actions in events
    const matchedEvents = events
      .filter((e) => e.actionId === activeAction.id || e.title.toLowerCase() === activeAction.name.toLowerCase())
      .map((e) => ({
        id: e.id,
        date: e.date,
        title: e.title,
        color: e.color || activeAction.color,
        description: e.description || '',
      }))

    if (matchedEvents.length > 0) {
      return matchedEvents.sort((a, b) => b.date.localeCompare(a.date))
    }

    // 2. Fallback to legacy entries if no modern events exist yet
    const legacyMatched = Object.entries(entries)
      .filter(([, entry]) => entry.category === activeAction.id || entry.category === activeAction.name)
      .map(([dateKey, entry]) => ({
        id: `legacy-${dateKey}`,
        date: dateKey,
        title: activeAction.name,
        color: activeAction.color,
        description: entry.note || '',
      }))

    return legacyMatched.sort((a, b) => b.date.localeCompare(a.date))
  }, [events, entries, activeAction])

  return (
    <section aria-label="Activity history" className="flex flex-col">
      {/* Action Filter Chips Carousel */}
      <div
        role="tablist"
        aria-label="Filter activities"
        className="-mx-4 px-4 flex gap-2.5 mb-3 overflow-x-auto no-scrollbar py-2 items-center"
      >
        {actionList.map((action) => {
          const isSelected = (activeAction?.id || '') === action.id
          const token = getColorToken(action.color)

          return (
            <button
              key={action.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedActionId(action.id)}
              className={`flex-shrink-0 h-11 min-w-[5.5rem] px-4 rounded-2xl text-xs font-bold tracking-wide transition-all duration-150 flex items-center justify-center gap-2 shadow-xs border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B] active:scale-95 ${
                isSelected
                  ? 'border-black/15 shadow-sm ring-2 ring-[#1E1B4B]/20'
                  : 'bg-[#EEF2FF] text-[#1E1B4B] border-black/5 hover:bg-white'
              }`}
              style={
                isSelected && token
                  ? {
                      backgroundColor: token.hex,
                      color: token.textColor,
                    }
                  : undefined
              }
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/15 flex-shrink-0"
                style={{ backgroundColor: token ? token.hex : action.color }}
                aria-hidden="true"
              />
              <span>{action.name}</span>
            </button>
          )
        })}
      </div>

      {/* Counter Label */}
      <p className="text-xs font-bold text-[#1E1B4B] mb-3 select-none" aria-live="polite">
        {displayItems.length} {displayItems.length === 1 ? 'entry' : 'entries'} found
      </p>

      {/* Empty State */}
      {displayItems.length === 0 ? (
        <div className="bg-[#FAF8FF] rounded-3xl p-8 text-center border border-black/5 shadow-xs flex flex-col items-center justify-center gap-2">
          <div className="w-14 h-14 rounded-full bg-[#C7D2FE]/30 text-[#4F46E5] flex items-center justify-center mb-1">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#1E1B4B]">
            No {activeAction?.name || 'activity'} entries yet
          </p>
          <p className="text-xs text-[#45464F]">
            Select dates on the calendar to log this activity.
          </p>
        </div>
      ) : (
        /* Logged Activity History Cards */
        <ul className="flex flex-col gap-3" aria-label={`${activeAction?.name} entries`}>
          {displayItems.map((item, index) => {
            const previousDateKey = index + 1 < displayItems.length ? displayItems[index + 1].date : null
            const daysSincePrevious = previousDateKey ? daysBetween(item.date, previousDateKey) : null
            const token = getColorToken(item.color)

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectDate(item.date)}
                  aria-label={`Open entry for ${formatDate(item.date)}${daysSincePrevious !== null ? `, ${daysSincePrevious} day${daysSincePrevious === 1 ? '' : 's'} since last` : ''}`}
                  className="w-full text-left bg-[#EEF2FF] hover:bg-white active:scale-98 rounded-2xl p-4 shadow-sm border border-black/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B] flex flex-col gap-2.5"
                >
                  {/* Card Header: Action Pill + Date + Interval */}
                  <div className="flex items-center justify-between w-full flex-wrap gap-2">
                    <span
                      className="px-2.5 py-1 rounded-md text-xs font-bold shadow-2xs"
                      style={{
                        backgroundColor: token ? token.hex : '#4F46E5',
                        color: token ? token.textColor : '#FFFFFF',
                      }}
                    >
                      {item.title}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs text-[#45464F]">
                      <time dateTime={item.date} className="font-bold text-[#1E1B4B]">
                        {formatDate(item.date)}
                      </time>
                      {daysSincePrevious !== null && (
                        <span className="font-semibold">
                          &middot; {daysSincePrevious} {daysSincePrevious === 1 ? 'day' : 'days'} since last
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Session Description (Scrollable if > 10 lines, non-editable) */}
                  {item.description ? (
                    <div className="w-full pl-3 border-l-2 border-[#1E1B4B]/20">
                      <div className="text-xs font-medium text-[#1E1B4B] whitespace-pre-wrap leading-relaxed max-h-[15em] overflow-y-auto select-text">
                        {item.description}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-[#767680] italic pl-3">
                      No description logged for this session
                    </p>
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
  events: PropTypes.arrayOf(PropTypes.object),
  actions: PropTypes.arrayOf(PropTypes.object),
  entries: PropTypes.objectOf(PropTypes.object),
  categories: PropTypes.arrayOf(PropTypes.object),
  onSelectDate: PropTypes.func.isRequired,
}