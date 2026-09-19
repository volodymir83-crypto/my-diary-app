// src/components/Calendar.jsx
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

  // 0: Prev month, 1: Current month, 2: Next month
  const [activeIndex, setActiveIndex] = useState(1)

  const scrollContainerRef = useRef(null)
  const isUpdatingRef = useRef(false)
  const scrollTimeoutRef = useRef(null)

  const prevDate = useMemo(() => getPrevMonth(year, month), [year, month])
  const nextDate = useMemo(() => getNextMonth(year, month), [year, month])

  // Real-time display date synced with swipe gesture
  const displayDate =
    activeIndex === 0 ? prevDate :
    activeIndex === 2 ? nextDate :
    { year, month }

  const isCurrentMonth = displayDate.year === today.getFullYear() && displayDate.month === today.getMonth()

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

  // Native Android 'scrollend' event for zero-delay snap detection
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

    const currentPosition = el.scrollLeft / width
    const targetIndex = Math.min(2, Math.max(0, Math.round(currentPosition)))
    if (targetIndex !== activeIndex) {
      setActiveIndex(targetIndex)
    }

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
      <div className="grid grid-cols-7 gap-1.5 w-full">
        {cells}
      </div>
    )
  }

  return (
    <section aria-label="Calendar" className="flex-1 flex flex-col w-full">
      {/* Month Header Bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={scrollToPrev}
          aria-label="Previous month"
          className="w-12 h-12 flex items-center justify-center rounded-full text-[#1E1B4B] hover:bg-black/5 active:bg-black/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-[#1E1B4B] tracking-tight select-none">{monthLabel}</h2>
        <button
          onClick={scrollToNext}
          aria-label="Next month"
          className="w-12 h-12 flex items-center justify-center rounded-full text-[#1E1B4B] hover:bg-black/5 active:bg-black/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers — WCAG AAA contrast (#1E1B4B on #A5B4FC) */}
      <div className="grid grid-cols-7 mb-1.5">
        {DAYS.map(d => (
          <div
            key={d}
            className="text-center text-xs font-bold text-[#1E1B4B] py-1 select-none"
            aria-hidden="true"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Horizontal Swipeable Track with CSS Scroll Snap */}
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

      {/* M3 Tonal FAB for "Today" (Luminous Frost #EEF2FF + Deep Midnight #1E1B4B) */}
      <div className="fixed bottom-24 left-0 right-0 max-w-lg mx-auto px-4 pointer-events-none flex justify-end z-20">
        <button
          onClick={goToToday}
          aria-label="Jump back to current month"
          tabIndex={isCurrentMonth ? -1 : 0}
          className={`pointer-events-auto flex items-center h-12 px-5 rounded-2xl bg-[#EEF2FF] text-[#1E1B4B] hover:bg-white active:scale-95 border border-black/10 font-semibold text-xs tracking-wide shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B] ${
            isCurrentMonth
              ? "opacity-0 translate-y-3 pointer-events-none"
              : "opacity-100 translate-y-0"
          }`}
        >
          <svg
            className="w-4 h-4 mr-2 flex-shrink-0 text-[#1E1B4B]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Today</span>
        </button>
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
      id:    PropTypes.number.isRequired,
      date:  PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelectDate: PropTypes.func.isRequired,
}