// src/components/Calendar.jsx
import { useState, useRef, useLayoutEffect, useEffect, useMemo, useCallback } from "react"
import DayCell from "./DayCell"
import PropTypes from 'prop-types'


const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const TOTAL_SLOTS = 42 // 6 uniform rows * 7 columns

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

  const [displayDate, setDisplayDate] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth()
  }))

  const [activeIndex, setActiveIndex] = useState(1)

  const scrollContainerRef = useRef(null)
  const isUpdatingRef = useRef(false)
  const isTouchDownRef = useRef(false)
  const scrollTimeoutRef = useRef(null)

  const prevDate = useMemo(() => getPrevMonth(year, month), [year, month])
  const nextDate = useMemo(() => getNextMonth(year, month), [year, month])

  const monthLabel = useMemo(() => {
    return new Date(displayDate.year, displayDate.month).toLocaleString("default", {
      month: "long", year: "numeric"
    })
  }, [displayDate.year, displayDate.month])

  const todayMonthShort = useMemo(() => {
    return today.toLocaleString("default", { month: "short" }).toUpperCase()
  }, [today])
  const todayDayNumber = today.getDate()
  const todayFormatted = useMemo(() => {
    return today.toLocaleDateString("default", { month: "long", day: "numeric", year: "numeric" })
  }, [today])

  const centerTrack = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el || el.offsetWidth === 0) return
    isUpdatingRef.current = true
    el.scrollLeft = el.offsetWidth

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isUpdatingRef.current = false
      })
    })
  }, [])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    centerTrack()

    const ro = new ResizeObserver(() => {
      centerTrack()
    })
    ro.observe(el)

    return () => ro.disconnect()
  }, [centerTrack])

  useLayoutEffect(() => {
    centerTrack()
  }, [year, month, centerTrack])

  const commitScroll = useCallback(() => {
    if (isTouchDownRef.current) return

    const el = scrollContainerRef.current
    if (!el) return
    const width = el.offsetWidth
    if (!width) return
    const finalIndex = Math.round(el.scrollLeft / width)

    if (finalIndex === 0) {
      isUpdatingRef.current = true
      setYear(prevDate.year)
      setMonth(prevDate.month)
      setDisplayDate(prevDate)
      setActiveIndex(1)
    } else if (finalIndex === 2) {
      isUpdatingRef.current = true
      setYear(nextDate.year)
      setMonth(nextDate.month)
      setDisplayDate(nextDate)
      setActiveIndex(1)
    } else {
      setActiveIndex(1)
    }
  }, [prevDate, nextDate])

  const hasNativeScrollEnd = typeof window !== 'undefined' && 'onscrollend' in window

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    function onScrollEnd() {
      if (isUpdatingRef.current || isTouchDownRef.current) return
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
      if (targetIndex === 0) setDisplayDate(prevDate)
      else if (targetIndex === 2) setDisplayDate(nextDate)
      else setDisplayDate({ year, month })
    }

    if (!hasNativeScrollEnd) {
      clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(() => {
        if (!isUpdatingRef.current && !isTouchDownRef.current) {
          commitScroll()
        }
      }, 140)
    }
  }

  function handleTouchStart() {
    isTouchDownRef.current = true
  }

  function handleTouchEnd() {
    isTouchDownRef.current = false
    if (!hasNativeScrollEnd) {
      clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(() => {
        if (!isUpdatingRef.current) {
          commitScroll()
        }
      }, 140)
    }
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
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth()
    const el = scrollContainerRef.current

    if (year === todayYear && month === todayMonth) {
      setDisplayDate({ year: todayYear, month: todayMonth })
      setActiveIndex(1)
      if (el) {
        el.scrollTo({ left: el.offsetWidth, behavior: "smooth" })
      }
      return
    }

    const todayState = { year: todayYear, month: todayMonth }
    setDisplayDate(todayState)
    setActiveIndex(1)
    setYear(todayYear)
    setMonth(todayMonth)
  }

  // Renders 42 slots (6 uniform rows) with full-width action pills & note indicators
  function renderMonthGrid(y, m, isInteractive = true) {
    const daysInMonth = getDaysInMonth(y, m)
    const firstDaySlot = getFirstDayOfMonth(y, m)
    const cells = []

    // Leading empty slots
    for (let i = 0; i < firstDaySlot; i++) {
      cells.push(<div key={`empty-${y}-${m}-${i}`} className="w-full h-full" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const isToday =
        day === today.getDate() &&
        m === today.getMonth() &&
        y === today.getFullYear()

      const dayEvents = events.filter(e => e.date === dateKey)
      const dayEntry = entries[dateKey] || null
      const entryColor = dayEntry?.color || null
      const hasNote = Boolean(dayEntry?.note && dayEntry.note.trim().length > 0)

      cells.push(
        <DayCell
          key={dateKey}
          day={day}
          dateKey={dateKey}
          isToday={isToday}
          hasNote={hasNote}
          entryColor={entryColor}
          events={dayEvents}
          isInteractive={isInteractive}
          onClick={isInteractive ? () => onSelectDate(dateKey) : undefined}
        />
      )
    }

    // Trailing empty slots up to 42
    const remainingSlots = TOTAL_SLOTS - (firstDaySlot + daysInMonth)
    for (let i = 0; i < remainingSlots; i++) {
      cells.push(<div key={`empty-end-${y}-${m}-${i}`} className="w-full h-full" />)
    }

    return (
      <div className="grid grid-cols-7 grid-rows-6 gap-0.5 w-full h-full select-none p-1">
        {cells}
      </div>
    )
  }

  return (
    <section aria-label="Calendar" className="flex-1 min-h-0 flex flex-col w-full h-full">
      {/* Unified M3 Top App Bar */}
      <header className="bg-[#EEF2FF] px-3.5 py-2 shadow-sm border-b border-black/5 flex items-center justify-between select-none flex-shrink-0 h-14">
        {/* Left: App Logo */}
        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
          <img
            src="/diary-icon.webp"
            alt=""
            aria-hidden="true"
            className="w-7 h-7 rounded-lg object-contain shadow-xs"
          />
        </div>

        {/* Center: Month/Year Level-1 Heading with Chevrons */}
        <div className="flex items-center justify-center gap-1.5 flex-1 min-w-0 mx-1">
          <button
            type="button"
            onClick={scrollToPrev}
            aria-label="Previous month"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#1E1B4B] active:scale-90 active:bg-black/10 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-base font-bold text-[#1E1B4B] tracking-tight truncate px-1 text-center">
            {monthLabel}
          </h1>

          <button
            type="button"
            onClick={scrollToNext}
            aria-label="Next month"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#1E1B4B] active:scale-90 active:bg-black/10 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Right: Dynamic Tear-Off Calendar Sheet Button */}
        <button
          type="button"
          onClick={goToToday}
          aria-label={`Jump to today, ${todayFormatted}`}
          className="w-10 h-10 flex items-center justify-center rounded-xl active:scale-90 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] flex-shrink-0"
        >
          <div className="w-8 h-9 rounded-lg bg-white border border-black/15 shadow-xs overflow-hidden flex flex-col items-center">
            <div className="w-full h-3 bg-[#4F46E5] text-white text-[7.5px] font-extrabold tracking-wider uppercase flex items-center justify-center">
              {todayMonthShort}
            </div>
            <div className="w-full flex-1 flex items-center justify-center bg-white text-[#1E1B4B] text-xs font-black leading-none">
              {todayDayNumber}
            </div>
          </div>
        </button>
      </header>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 my-1 select-none px-1 flex-shrink-0">
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

      {/* Full-Height 6-Row Native Scroll Track */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden select-none px-0.5 h-full">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full h-full"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Panel -1: Previous Month */}
          <div
            className="w-full flex-shrink-0 snap-start snap-always px-0.5 h-full flex flex-col overflow-hidden"
            style={{ scrollSnapStop: 'always' }}
            aria-hidden="true"
          >
            {renderMonthGrid(prevDate.year, prevDate.month, false)}
          </div>

          {/* Panel 0: Current Month */}
          <div
            className="w-full flex-shrink-0 snap-start snap-always px-0.5 h-full flex flex-col overflow-hidden"
            style={{ scrollSnapStop: 'always' }}
          >
            {renderMonthGrid(year, month, true)}
          </div>

          {/* Panel +1: Next Month */}
          <div
            className="w-full flex-shrink-0 snap-start snap-always px-0.5 h-full flex flex-col overflow-hidden"
            style={{ scrollSnapStop: 'always' }}
            aria-hidden="true"
          >
            {renderMonthGrid(nextDate.year, nextDate.month, false)}
          </div>
        </div>
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
      color: PropTypes.string,
    })
  ).isRequired,
  onSelectDate: PropTypes.func.isRequired,
}