// src/components/DiaryEntry.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import RecurringActionsTab from './RecurringActionsTab'
import NotesTab from './NotesTab'

export default function DiaryEntry({
  dateKey,
  events,
  actions,
  notes,
  onAddAction,
  onDeleteAction,
  onAddDayAction,
  onUpdateDayAction,
  onDeleteDayAction,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onClose,
}) {
  // Tabs: 'actions' (Recurring actions) vs 'notes' (Notes)
  const [activeTab, setActiveTab] = useState('actions')

  // M3 Exit Motion State (150ms slide-down before unmounting)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimerRef = useRef(null)

  const startClosing = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
    closeTimerRef.current = setTimeout(() => {
      onClose()
    }, 150)
  }, [isClosing, onClose])

  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current)
  }, [])

  // Close on Escape key press (WCAG 2.2 AA)
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') startClosing()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [startClosing])

  // Count notes for the tab badge
  const dayNotesCount = notes.filter((n) => n.date === dateKey).length

  const formattedDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Diary entry for ${formattedDate}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none"
    >
      {/* Accessible Backdrop Scrim */}
      <button
        type="button"
        aria-label="Close dialog backdrop"
        tabIndex={-1}
        onClick={startClosing}
        className={`fixed inset-0 bg-black/60 cursor-default border-0 outline-none ${
          isClosing ? 'animate-m3-backdrop-exit' : 'animate-m3-backdrop-enter'
        }`}
      />

      {/* M3 Modal Dialog Sheet */}
      <div
        className={`relative z-10 bg-[#FAF8FF] rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-black/5 flex flex-col font-sans ${
          isClosing ? 'animate-m3-dialog-exit' : 'animate-m3-dialog-enter'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/5 sticky top-0 bg-[#FAF8FF] z-20">
          <div>
            <h2 className="text-base font-bold text-[#1E1B4B] tracking-tight">{formattedDate}</h2>
            <p className="text-xs font-semibold text-[#45464F]">Activity Log &amp; Notes</p>
          </div>
          <button
            type="button"
            onClick={startClosing}
            aria-label="Close dialog"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#1E1B4B] hover:bg-black/5 active:bg-black/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Top Segmented Tabs */}
          <div className="flex rounded-2xl bg-[#EEF2FF] p-1 border border-black/5">
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className={`flex-1 h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
                activeTab === 'actions'
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'text-[#1E1B4B] hover:bg-black/5'
              }`}
            >
              Recurring actions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`flex-1 h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
                activeTab === 'notes'
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'text-[#1E1B4B] hover:bg-black/5'
              }`}
            >
              Notes ({dayNotesCount})
            </button>
          </div>

          {/* Tab Views */}
          {activeTab === 'actions' ? (
            <RecurringActionsTab
              dateKey={dateKey}
              events={events}
              actions={actions}
              onAddAction={onAddAction}
              onDeleteAction={onDeleteAction}
              onAddDayAction={onAddDayAction}
              onUpdateDayAction={onUpdateDayAction}
              onDeleteDayAction={onDeleteDayAction}
            />
          ) : (
            <NotesTab
              dateKey={dateKey}
              notes={notes}
              onAddNote={onAddNote}
              onUpdateNote={onUpdateNote}
              onDeleteNote={onDeleteNote}
            />
          )}
        </div>
      </div>
    </div>
  )
}

DiaryEntry.propTypes = {
  dateKey:           PropTypes.string.isRequired,
  events:            PropTypes.arrayOf(PropTypes.object).isRequired,
  actions:           PropTypes.arrayOf(PropTypes.object).isRequired,
  notes:             PropTypes.arrayOf(PropTypes.object).isRequired,
  onAddAction:       PropTypes.func.isRequired,
  onDeleteAction:    PropTypes.func.isRequired,
  onAddDayAction:    PropTypes.func.isRequired,
  onUpdateDayAction: PropTypes.func.isRequired,
  onDeleteDayAction: PropTypes.func.isRequired,
  onAddNote:         PropTypes.func.isRequired,
  onUpdateNote:      PropTypes.func.isRequired,
  onDeleteNote:      PropTypes.func.isRequired,
  onClose:           PropTypes.func.isRequired,
}