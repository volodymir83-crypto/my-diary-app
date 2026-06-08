import { useState } from "react"
import DayCell from "./DayCell"
import PropTypes from 'prop-types'

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7
}

export default function Calendar({ entries, events, onSelectDate }) {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const daysInMonth  = getDaysInMonth(year, month)
  const firstDaySlot = getFirstDayOfMonth(year, month)

  const monthLabel = new Date(year, month).toLocaleString("default", {
    month: "long", year: "numeric"
  })

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const cells = []

  // empty slots before day 1
  for (let i = 0; i < firstDaySlot; i++) {
    cells.push(<div key={`empty-${i}`} />)
  }

  // actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()

    const dayEvents  = events.filter(e => e.date === dateKey)
    const entryColor = entries[dateKey]?.color || null

    cells.push(
      <DayCell
        key={dateKey}
        day={day}
        dateKey={dateKey}
        isToday={isToday}
        entryColor={entryColor}
        events={dayEvents}
        onClick={() => onSelectDate(dateKey)}
      />
    )
  }

  return (
    <section aria-label="Calendar">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          className="p-2 rounded-full hover:bg-gray-200 active:bg-gray-300 transition"
        >
          ◀
        </button>
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="p-2 rounded-full hover:bg-gray-200 active:bg-gray-300 transition"
        >
          ▶
        </button>
      </div>
{/* Today button */}
      {!isCurrentMonth && (
        <div className="flex justify-center mb-2 -mt-2">
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
            aria-label="Go to current month"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1 rounded-full hover:bg-blue-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            ↩ Today
          </button>
        </div>
      )}

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-500 py-1"
            aria-hidden="true"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>
    </section>
  )
}

Calendar.propTypes = {
  entries: PropTypes.objectOf(
    PropTypes.shape({
      note:     PropTypes.string,
      color:    PropTypes.string,
      category: PropTypes.string,
    })
  ).isRequired,
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelectDate: PropTypes.func.isRequired,
}