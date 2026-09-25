// src/components/DayCell.jsx
import PropTypes from 'prop-types'
import { getColorToken } from '../utils/m3Palette'

export default function DayCell({ day, dateKey, isToday, entryColor, events, onClick }) {
  const colorToken = getColorToken(entryColor)
  const hasNote    = Boolean(entryColor)
  const hasEvents  = events.length > 0

  const ariaLabel = [
    `${dateKey}`,
    isToday ? "today" : "",
    hasNote ? `has diary entry (${colorToken?.label || 'highlighted'})` : "",
    hasEvents ? `${events.length} event(s)` : "",
  ].filter(Boolean).join(", ")

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={[
        "relative flex flex-col items-center justify-start",
        "w-full aspect-square rounded-xl pt-1.5 pb-1",
        // Scoped transform transition only for active tap: zero GPU thrashing during swipes
        "transition-transform duration-100",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B] focus-visible:z-10",
        "active:scale-95 shadow-sm",
        colorToken
          ? "border border-black/10"
          : "bg-[#EEF2FF] text-[#1E1B4B] hover:bg-white border border-white/60",
        isToday
          ? "ring-2 ring-[#1E1B4B] font-bold"
          : "font-medium",
      ].join(" ")}
      style={
        colorToken
          ? {
              backgroundColor: colorToken.container,
              color: colorToken.onContainer,
            }
          : undefined
      }
    >
      <span className="text-sm leading-tight select-none">{day}</span>

      {/* Event dots */}
      {hasEvents && (
        <div
          className="flex gap-1 mt-1 flex-wrap justify-center px-0.5"
          aria-hidden="true"
        >
          {events.slice(0, 3).map(event => {
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
    </button>
  )
}

DayCell.propTypes = {
  day:        PropTypes.number.isRequired,
  dateKey:    PropTypes.string.isRequired,
  isToday:    PropTypes.bool.isRequired,
  entryColor: PropTypes.string,
  events:     PropTypes.arrayOf(
    PropTypes.shape({
      id:    PropTypes.number.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
  onClick: PropTypes.func.isRequired,
}

DayCell.defaultProps = {
  entryColor: null,
}