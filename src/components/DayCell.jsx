import PropTypes from 'prop-types'

export default function DayCell({ day, dateKey, isToday, entryColor, events, onClick }) {
  const hasNote   = Boolean(entryColor)
  const hasEvents = events.length > 0

  const ariaLabel = [
    `${dateKey}`,
    isToday ? "today" : "",
    hasNote ? "has diary entry" : "",
    hasEvents ? `${events.length} event(s)` : "",
  ].filter(Boolean).join(", ")

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={[
        "relative flex flex-col items-center justify-start",
        "w-full aspect-square rounded-xl pt-1 pb-1",
        "text-sm font-medium transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "active:scale-95",
        isToday
          ? "ring-2 ring-blue-500 text-blue-700 font-bold"
          : "text-gray-800 hover:bg-gray-100",
      ].join(" ")}
      style={entryColor ? { backgroundColor: entryColor } : {}}
    >
      <span>{day}</span>

      {/* Event dots */}
      {hasEvents && (
        <div
          className="flex gap-0.5 mt-0.5 flex-wrap justify-center"
          aria-hidden="true"
        >
          {events.slice(0, 3).map(event => (
            <span
              key={event.id}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: event.color }}
            />
          ))}
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