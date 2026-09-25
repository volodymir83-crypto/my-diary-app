// src/components/Calendar.jsx
import { useState, useRef, useLayoutEffect, useEffect, useMemo, useCallback } from "react"
import DayCell from "./DayCell"
import PropTypes from 'prop-types'
import { getColorToken } from '../utils/m3Palette'

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

  // Real-time display date: updates instantly during native scroll
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

  const isCurrentMonth = displayDate.year === today.getFullYear() && displayDate.month === today.getMonth()

  const monthLabel = useMemo(() => {
    return new Date(displayDate.year, displayDate.month).toLocaleString("default", {
      month: "long", year: "numeric"
    })
  }, [displayDate.year, displayDate.month])

  // Center scroll container silently without triggering animation
  const centerTrack = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el || el.offsetWidth === 0) return
    isUpdatingRef.current = true
    el.scrollLeft = el.offsetWidth

    // Drain compositor queue across 2 animation frames before unlocking
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isUpdatingRef.current = false
      })
    })
  }, [])

  // Fix 1: Guarantee proper centering on cold app launch as soon as layout dimensions settle
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    centerTrack()

    // Observe size in case WebView layout finishes after mount
    const ro = new ResizeObserver(() => {
      centerTrack()
    })
    ro.observe(el)

    return () => ro.disconnect()
  }, [centerTrack])

  // Re-center whenever year or month state updates
  useLayoutEffect(() => {
    centerTrack()
  }, [year, month, centerTrack])

  // Commits the scroll, resetting the track to the center panel
  const commitScroll = useCallback(() => {
    // Never commit while the user's thumb is still on the glass
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

  // Fix 2: Feature-detect native 'scrollend'.
  // If native 'scrollend' exists, we DO NOT use a timeout to eliminate collision bugs.
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

  // Fires continuously during native momentum scrolling
  function handleScroll() {
    if (isUpdatingRef.current) return
    const el = scrollContainerRef.current
    if (!el) return

    const width = el.offsetWidth
    if (!width) return

    const currentPosition = el.scrollLeft / width
    const targetIndex = Math.min(2, Math.max(0, Math.round(currentPosition)))

    // Instantly update the title header based on which panel is most visible
    if (targetIndex !== activeIndex) {
      setActiveIndex(targetIndex)
      if (targetIndex === 0) setDisplayDate(prevDate)
      else if (targetIndex === 2) setDisplayDate(nextDate)
      else setDisplayDate({ year, month })
    }

    // Only run fallback timer on legacy WebViews that lack native 'scrollend'
    if (!hasNativeScrollEnd) {
      clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(() => {
        if (!isUpdatingRef.current && !isTouchDownRef.current) {
          commitScroll()
        }
      }, 140)
    }
  }

  // Fix 3: Touch handlers to prevent resetting while thumb is on the glass
  function handleTouchStart() {
    isTouchDownRef.current = true
  }

  function handleTouchEnd() {
    isTouchDownRef.current = false
    // If on legacy device without scrollend, check for commit after release
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
    isUpdatingRef.current = true
    setActiveIndex(1)
    const todayState = { year: today.getFullYear(), month: today.getMonth() }
    setDisplayDate(todayState)
    setYear(todayState.year)
    setMonth(todayState.month)
  }

  // Renders standard interactive DayCells for the current month,
  // and static visually-identical tiles for off-screen panels (0 memory bloat, 0 aria errors).
  function renderMonthGrid(y, m, isInteractive = true) {
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

      if (isInteractive) {
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
      } else {
        const token = getColorToken(entryColor)
        const hasEvents = dayEvents.length > 0

        cells.push(
          <div
            key={dateKey}
            className={[
              "relative flex flex-col items-center justify-start",
              "w-full aspect-square rounded-xl pt-1.5 pb-1 shadow-sm select-none pointer-events-none",
              token
                ? "border border-black/10"
                : "bg-[#EEF2FF] text-[#1E1B4B] border border-white/60",
              isToday
                ? "ring-2 ring-[#1E1B4B] font-bold"
                : "font-medium"
            ].join(" ")}
            style={token ? { backgroundColor: token.container, color: token.onContainer } : undefined}
          >
            <span className="text-sm leading-tight">{day}</span>
            {hasEvents && (
              <div className="flex gap-1 mt-1 flex-wrap justify-center px-0.5" aria-hidden="true">
                {dayEvents.slice(0, 3).map(event => {
                  const eventToken = getColorToken(event.color)
                  return (
                    <span
                      key={event.id}
                      className="w-1.5 h-1.5 rounded-full ring-1 ring-white/80"
                      style={{ backgroundColor: eventToken ? eventToken.accent : event.color }}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      }
    }

    return (
      <div className="grid grid-cols-7 gap-1.5 w-full select-none">
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
      <div className="grid grid-cols-7 mb-1.5 select-none">
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

      {/* Hardware-Accelerated Native Scroll Track */}
      <div className="-m-2 p-2 flex-1 flex flex-col overflow-hidden select-none">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full flex-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Panel -1: Previous Month */}
          <div
            className="w-full flex-shrink-0 snap-start snap-always px-0.5 h-full flex flex-col"
            style={{ scrollSnapStop: 'always' }}
            aria-hidden="true"
          >
            {renderMonthGrid(prevDate.year, prevDate.month, false)}
            <div className="flex-1 min-h-[5rem]" />
          </div>

          {/* Panel 0: Current Month */}
          <div
            className="w-full flex-shrink-0 snap-start snap-always px-0.5 h-full flex flex-col"
            style={{ scrollSnapStop: 'always' }}
          >
            {renderMonthGrid(year, month, true)}
            <div className="flex-1 min-h-[5rem]" />
          </div>

          {/* Panel +1: Next Month */}
          <div
            className="w-full flex-shrink-0 snap-start snap-always px-0.5 h-full flex flex-col"
            style={{ scrollSnapStop: 'always' }}
            aria-hidden="true"
          >
            {renderMonthGrid(nextDate.year, nextDate.month, false)}
            <div className="flex-1 min-h-[5rem]" />
          </div>
        </div>
      </div>

      {/* M3 Tonal FAB for "Today" */}
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