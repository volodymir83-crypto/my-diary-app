import { useState } from 'react'
import PropTypes from 'prop-types'
import { truncateNote } from '../utils/notePreview'

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

  const cat = categories.find(c => c.id === categoryId)

  const filtered = Object.entries(entries)
    .filter(([, entry]) => entry.category === categoryId)
    .sort(([a], [b]) => b.localeCompare(a))

  return (
    <section aria-label="Workout history">

      {/* Category tabs */}
      <div role="tablist" aria-label="Workout category" className="flex gap-2 mb-4 flex-wrap">
        {categories.map(c => (
          <button
            key={c.id}
            role="tab"
            aria-selected={categoryId === c.id}
            onClick={() => setCategoryId(c.id)}
            className={[
              'flex-1 py-2 rounded-xl text-sm font-medium shadow-md transition min-w-[4rem]',
              categoryId === c.id
                ? 'ring-1 ring-blue-500 '
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600',
            ].join(' ')}
            style={categoryId === c.id ? { backgroundColor: c.color } : {}}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500 mb-3" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} found
      </p>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="text-4xl mb-2" aria-hidden="true">📭</p>
          <p className="text-sm">No {cat?.label} entries yet</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label={`${cat?.label} entries`}>
          {filtered.map(([dateKey, entry], index) => {
            const previousDateKey = index + 1 < filtered.length ? filtered[index + 1][0] : null
            const daysSincePrevious = previousDateKey ? daysBetween(dateKey, previousDateKey) : null
            const { text: notePreview, truncated: noteTruncated } = truncateNote(entry.note)

            return (
              <li key={dateKey}>
                <button
                  onClick={() => onSelectDate(dateKey)}
                  aria-label={`Open entry for ${formatDate(dateKey)}${daysSincePrevious !== null ? `, ${daysSincePrevious} day${daysSincePrevious === 1 ? '' : 's'} since the previous ${cat?.label} entry` : ''}${noteTruncated ? ', note truncated, open to read the full entry' : ''}`}
                  className="w-full text-left bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:border-blue-300 active:bg-gray-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat?.color }}
                      aria-hidden="true"
                    />
                    <time dateTime={dateKey} className="text-xs font-medium text-gray-500">
                      {formatDate(dateKey)}
                    </time>
                    {daysSincePrevious !== null && (
                      <span className="text-xs text-gray-600" aria-hidden="true">
              · {daysSincePrevious} {daysSincePrevious === 1 ? 'day' : 'days'} since last
            </span>
                    )}
                  </div>
                  {entry.note ? (
                    <div className="ml-5">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{notePreview}</p>
                      {noteTruncated && (
                        <span className="text-xs text-blue-600 font-medium" aria-hidden="true">
                          Read more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 italic ml-5">No notes</p>
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