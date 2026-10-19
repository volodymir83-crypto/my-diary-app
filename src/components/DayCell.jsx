// src/components/DayCell.jsx
import PropTypes from 'prop-types'
import { getColorToken } from '../utils/m3Palette'

export default function DayCell({
  day,
  dateKey,
  isToday,
  hasNote = false,
  entryColor = null,
  events = [],
  isInteractive = true,
  onClick,
}) {
  const colorToken = getColorToken(entryColor)
  const totalEvents = events.length

  const ariaLabel = isInteractive
    ? [
        `${dateKey}`,
        isToday ? "today" : "",
        hasNote ? "has diary note" : "",
        totalEvents > 0 ? `${totalEvents} action(s)` : "",
      ].filter(Boolean).join(", ")
    : undefined

  // Up to 3 pills; slot 3 becomes "+N more" if > 3 actions
  const hasOverflow = totalEvents > 3
  const visibleEvents = hasOverflow ? events.slice(0, 2) : events.slice(0, 3)
  const overflowCount = hasOverflow ? totalEvents - 2 : 0

  // Polymorphic root: renders <button> when active, <div> when off-screen preview
  const Component = isInteractive ? 'button' : 'div'

  return (
    <Component
      type={isInteractive ? 'button' : undefined}
      onClick={isInteractive ? onClick : undefined}
      aria-label={ariaLabel}
      aria-hidden={!isInteractive ? true : undefined}
      className={[
        "relative flex flex-col justify-between items-start",
        "w-full h-full rounded-lg p-0.5 overflow-hidden text-left",
        isInteractive
          ? "transition-transform duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B] focus-visible:z-10 active:scale-95 shadow-xs"
          : "select-none pointer-events-none shadow-xs",
        colorToken
          ? "border border-black/10"
          : "bg-[#EEF2FF] text-[#1E1B4B] border border-white/60 hover:bg-white",
        isToday ? "font-bold" : "font-medium",
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
      {/* Top Row: Date Number (Google Calendar Filled Badge when Today) & Boxed Pencil Glyph */}
      <div className="flex items-center justify-between w-full select-none leading-none px-0.5">
        {isToday ? (
          <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[#4F46E5] text-[#EEF2FF] text-[11px] sm:text-xs font-bold leading-none shadow-2xs">
            {day}
          </span>
        ) : (
          <span className="text-xs sm:text-sm font-bold tracking-tight text-[#1E1B4B] leading-none">
            {day}
          </span>
        )}
        {hasNote && (
          <div
            title="Has note"
            aria-hidden="true"
            className="w-3.5 h-3.5 rounded-sm border border-[#1E1B4B]/40 flex items-center justify-center text-[#1E1B4B]"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Middle/Body: Action Pills */}
      <div className="flex flex-col gap-0.5 w-full mt-1 overflow-hidden" aria-hidden="true">
        {visibleEvents.map((event) => {
          const hasCustomColor = Boolean(event.color && event.color !== 'none')
          const eventToken = hasCustomColor ? getColorToken(event.color) : null

          return (
              <div
                key={event.id}
                className="w-full h-3.5 sm:h-4 rounded-md px-1 flex-shrink-0 flex items-center justify-start overflow-hidden shadow-2xs"
                style={
                  hasCustomColor && eventToken
                    ? {
                        backgroundColor: eventToken.hex || eventToken.accent,
                        color: eventToken.textColor || '#FFFFFF',
                      }
                    : {
                        backgroundColor: '#E0E7FF',
                        color: '#1E1B4B',
                        border: '1px solid rgba(30, 27, 75, 0.3)',
                      }
                }
              >
                <span className="text-[9px] font-bold truncate leading-none text-left w-full whitespace-nowrap">
                  {event.title}
                </span>
              </div>
            )
        })}

        {/* 3rd Slot Overflow Badge: "+ N more" */}
        {hasOverflow && (
          <div className="w-full h-3.5 sm:h-4 rounded-md px-1 flex-shrink-0 flex items-center justify-start bg-[#EEF2FF] text-[#1E1B4B] shadow-2xs overflow-hidden">
            <span className="text-[8.5px] font-bold leading-none text-left w-full whitespace-nowrap truncate">
              +{overflowCount} more
            </span>
          </div>
        )}
      </div>
    </Component>
  )
}

DayCell.propTypes = {
  day:           PropTypes.number.isRequired,
  dateKey:       PropTypes.string.isRequired,
  isToday:       PropTypes.bool.isRequired,
  hasNote:       PropTypes.bool,
  entryColor:    PropTypes.string,
  isInteractive: PropTypes.bool,
  events:        PropTypes.arrayOf(
    PropTypes.shape({
      id:    PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      color: PropTypes.string,
    })
  ).isRequired,
  onClick: PropTypes.func,
}