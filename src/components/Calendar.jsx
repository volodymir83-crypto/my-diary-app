import { useState, useRef, useLayoutEffect, useEffect, useMemo, useCallback } from "react"
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

function getNextMonth(year, month) {
  return month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
}

function getPrevMonth(year, month) {
  return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
}

export default function Calendar({ entries, events, onSelectDate }) {
  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  // 0: Prev month visible, 1: Current month, 2: Next month visible
  const [activeIndex, setActiveIndex] = useState(1)

  const scrollContainerRef = useRef(null)
  const isUpdatingRef = useRef(false)
  const scrollTimeoutRef = useRef(null)

  const prevDate = useMemo(() => getPrevMonth(year, month), [year, month])
  const nextDate = useMemo(() => getNextMonth(year, month), [year, month])

  // Real-time display date: updates immediately as soon as swipe crosses 50%
  const displayDate =
    activeIndex === 0 ? prevDate :
    activeIndex === 2 ? nextDate :
    { year, month }

  const isCurrentMonth = displayDate.year === today.getFullYear() && displayDate.month === today.getMonth()
  const isFuture = displayDate.year > today.getFullYear() ||
    (displayDate.year === today.getFullYear() && displayDate.month > today.getMonth())

  const monthLabel = new Date(displayDate.year, displayDate.month).toLocaleString("default", {
    month: "long", year: "numeric"
  })

  // Center scroll container on Panel 1 (Current Month)
  useLayoutEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    isUpdatingRef.current = true
    el.scrollLeft = el.offsetWidth
    requestAnimationFrame(() => {
      isUpdatingRef.current = false
    })
  }, [year, month])

  const commitScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const width = el.offsetWidth
    if (!width) return
    const finalIndex = Math.round(el.scrollLeft / width)

    if (finalIndex === 0) {
      isUpdatingRef.current = true
      setYear(prevDate.year)
      setMonth(prevDate.month)
      setActiveIndex(1)
    } else if (finalIndex === 2) {
      isUpdatingRef.current = true
      setYear(nextDate.year)
      setMonth(nextDate.month)
      setActiveIndex(1)
    } else {
      setActiveIndex(1)
    }
  }, [prevDate, nextDate])

  // Native Android 'scrollend' event for instant zero-delay snap detection
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    function onScrollEnd() {
      if (isUpdatingRef.current) return
      commitScroll()
    }

    el.addEventListener("scrollend", onScrollEnd)
    return () => {
      el.removeEventListener("scrollend", onScrollEnd)
    }
  }, [commitScroll])

  function handleScroll() {
    if (isUpdatingRef.current) return
    const el = scrollContainerRef.current
    if (!el) return

    const width = el.offsetWidth
    if (!width) return

    // 1. Live Header Sync: calculate dominant month in real-time
    const currentPosition = el.scrollLeft / width
    const targetIndex = Math.min(2, Math.max(0, Math.round(currentPosition)))
    if (targetIndex !== activeIndex) {
      setActiveIndex(targetIndex)
    }

    // 2. Fallback settle timer for WebViews lacking native 'scrollend'
    clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      if (!isUpdatingRef.current) {
        commitScroll()
      }
    }, 80)
  }

  function scrollToPrev() {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ left: 0, behavior: "smooth" })
  }

  function scrollToNext() {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ left: el.offsetWidth * 2, behavior: "smooth" })
  }

  function goToToday() {
    isUpdatingRef.current = true
    setActiveIndex(1)
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }

  function renderMonthGrid(y, m) {
    const daysInMonth = getDaysInMonth(y, m)
    const firstDaySlot = getFirstDayOfMonth(y, m)
    const cells = []

    for (let i = 0; i < firstDaySlot; i++) {
      cells.push(<div key={`empty-${y}-${m}-${i}`} />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const isToday =
        day === today.getDate() &&
        m === today.getMonth() &&
        y === today.getFullYear()

      const dayEvents = events.filter(e => e.date === dateKey)
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
      <div className="grid grid-cols-7 gap-1 w-full">
        {cells}
      </div>
    )
  }

  return (
    <section aria-label="Calendar" className="flex-1 flex flex-col w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={scrollToPrev}
          aria-label="Previous month"
          className="p-2 rounded-full hover:bg-gray-200 active:bg-gray-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ◀
        </button>
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <button
          onClick={scrollToNext}
          aria-label="Next month"
          className="p-2 rounded-full hover:bg-gray-200 active:bg-gray-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ▶
        </button>
      </div>

      {/* Today button */}
      {!isCurrentMonth && (
        <div className="flex justify-center mb-2 -mt-2">
          <button
            onClick={goToToday}
            aria-label="Go to current month"
            className="text-base font-medium text-blue-600 hover:text-blue-700 px-4 py-2 rounded-full hover:bg-blue-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isFuture ? (
              <>
                <span className="text-3xl align-baseline" aria-hidden="true">↩</span>{' '}Today
              </>
            ) : (
              <>
                Today{' '}<span className="text-3xl align-baseline" aria-hidden="true">↪</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Day labels (fixed at top) */}
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

      {/* Full-height Touch Drag Track with CSS Scroll Snap */}
      <div className="-m-2 p-2 flex-1 flex flex-col overflow-hidden">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full flex-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Panel 0: Previous Month */}
          <div className="w-full flex-shrink-0 snap-start px-0.5 h-full flex flex-col">
            {renderMonthGrid(prevDate.year, prevDate.month)}
            <div className="flex-1 min-h-[5rem]" aria-hidden="true" />
          </div>

          {/* Panel 1: Current Month */}
          <div className="w-full flex-shrink-0 snap-start px-0.5 h-full flex flex-col">
            {renderMonthGrid(year, month)}
            <div className="flex-1 min-h-[5rem]" aria-hidden="true" />
          </div>

          {/* Panel 2: Next Month */}
          <div className="w-full flex-shrink-0 snap-start px-0.5 h-full flex flex-col">
            {renderMonthGrid(nextDate.year, nextDate.month)}
            <div className="flex-1 min-h-[5rem]" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  )
}

Calendar.propTypes = {
  entries: PropTypes.objectOf(
    PropTypes.shape({
      note: PropTypes.string,
      color: PropTypes.string,
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