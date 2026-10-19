// src/App.jsx
import { useState } from 'react'
import PropTypes from 'prop-types'
import { useDiary } from './hooks/useDiary'
import Calendar   from './components/Calendar'
import DiaryEntry from './components/DiaryEntry'
import History    from './components/History'
import Search     from './components/Search'
import Settings from './components/Settings'
import DevInspector from './components/DevInspector'

// Authentic M3 Navigation Icons (Filled when active, Outlined when inactive)
function NavIcon({ name, isActive }) {
  const iconProps = {
    className: "w-6 h-6 transition-transform duration-200",
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
  }

  if (name === 'calendar') {
    return isActive ? (
      <svg {...iconProps} fill="currentColor">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z" />
      </svg>
    ) : (
      <svg {...iconProps} fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  }

  if (name === 'history') {
    return isActive ? (
      <svg {...iconProps} fill="currentColor">
        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
      </svg>
    ) : (
      <svg {...iconProps} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    )
  }

  if (name === 'search') {
    return isActive ? (
      <svg {...iconProps} fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM1.75 10.5a8.75 8.75 0 1115.56 5.398l4.146 4.146a1 1 0 01-1.414 1.414l-4.146-4.146A8.75 8.75 0 011.75 10.5z" />
      </svg>
    ) : (
      <svg {...iconProps} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    )
  }

  if (name === 'settings') {
    return isActive ? (
      <svg {...iconProps} fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L8.914 5.76a7.518 7.518 0 00-1.748 1.01l-1.848-.795a1.875 1.875 0 00-2.28.694l-1.125 1.95a1.875 1.875 0 00.435 2.35l1.54 1.282a7.54 7.54 0 000 2.018l-1.54 1.282a1.875 1.875 0 00-.435 2.35l1.125 1.95a1.875 1.875 0 002.28.694l1.848-.795c.538.41 1.124.75 1.748 1.01l.314 1.943c.151.904.933 1.567 1.85 1.567h2.25c.917 0 1.699-.663 1.85-1.567l.314-1.943a7.518 7.518 0 001.748-1.01l1.848.795a1.875 1.875 0 002.28-.694l1.125-1.95a1.875 1.875 0 00-.435-2.35l-1.54-1.282a7.54 7.54 0 000-2.018l1.54-1.282a1.875 1.875 0 00.435-2.35l-1.125-1.95a1.875 1.875 0 00-2.28-.694l-1.848.795a7.518 7.518 0 00-1.748-1.01l-.314-1.943A1.875 1.875 0 0013.328 2.25h-2.25zM12 15a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    ) : (
      <svg {...iconProps} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    )
  }

  return null
}

NavIcon.propTypes = {
  name: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
}

const TABS = [
  { key: 'calendar', label: 'Calendar' },
  { key: 'history',  label: 'History'  },
  { key: 'search',   label: 'Search'   },
  { key: 'settings', label: 'Settings' },
]

export default function App() {
  const {
    entries, events, categories,
    importData,
    actions,
    notes,
    addAction,
    updateAction,
    deleteAction,
    addDayAction,
    updateDayAction,
    deleteDayAction,
    addNote,
    updateNote,
    deleteNote,
  } = useDiary()

  const [selectedDate, setSelectedDate] = useState(null)
  const [view,         setView]         = useState('calendar')

  function handleSelectDate(dateKey) {
    setSelectedDate(dateKey)
    setView('calendar')
  }

  return (
    <div className="h-screen h-[100dvh] bg-[#A5B4FC] flex flex-col overflow-hidden">

      {/* Contextual Top App Bar for secondary views */}
      {view !== 'calendar' && (
        <header className="bg-[#EEF2FF] px-4 py-3 shadow-sm border-b border-black/5 flex items-center justify-between select-none flex-shrink-0 h-14">
          <div className="flex items-center gap-2.5">
            <img
              src="/diary-icon.webp"
              alt=""
              aria-hidden="true"
              className="w-7 h-7 rounded-lg object-contain shadow-xs"
            />
            <h1 className="text-base font-bold text-[#1E1B4B] tracking-tight">
              {view === 'history' && 'Workout History'}
              {view === 'search' && 'Search Diary'}
              {view === 'settings' && 'Settings'}
            </h1>
          </div>
        </header>
      )}

      {/* Main View Area */}
      <main className={`flex-1 min-h-0 flex flex-col max-w-lg mx-auto w-full overflow-hidden ${
        view === 'calendar' ? 'p-0' : 'px-3 pt-3 overflow-y-auto'
      }`}>
        <div key={view} className="flex-1 min-h-0 flex flex-col h-full animate-m3-fade-through">
          {view === 'calendar' && (
            <Calendar
              entries={entries}
              events={events}
              onSelectDate={setSelectedDate}
            />
          )}
          {view === 'history' && (
            <History
              events={events}
              actions={actions}
              entries={entries}
              categories={categories}
              onSelectDate={handleSelectDate}
            />
          )}
          {view === 'search' && (
            <Search
              entries={entries}
              events={events}
              categories={categories}
              onSelectDate={handleSelectDate}
            />
          )}
          {view === 'settings' && (
            <Settings
              actions={actions}
              events={events}
              entries={entries}
              categories={categories}
              onAddAction={addAction}
              onUpdateAction={updateAction}
              onDeleteAction={deleteAction}
              onImport={importData}
            />
          )}
        </div>
      </main>

      {/* M3 Navigation Bar */}
      <nav
        aria-label="Main navigation"
        className="bg-[#EEF2FF] border-t border-black/5 flex justify-around items-center h-20 px-2 shadow-lg z-30 flex-shrink-0 w-full"
      >
        {TABS.map(tab => {
          const isActive = view === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] rounded-xl"
            >
              <div
                className={`w-16 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-[#C7D2FE] text-[#4F46E5] shadow-xs'
                    : 'bg-transparent text-[#1E1B4B] hover:bg-black/5'
                }`}
              >
                <NavIcon name={tab.key} isActive={isActive} />
              </div>
              <span
                className={`text-xs mt-1 transition-colors select-none ${
                  isActive
                    ? 'font-bold text-[#4F46E5]'
                    : 'font-medium text-[#1E1B4B]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Diary Entry Modal Sheet */}
      {selectedDate && (
        <DiaryEntry
          dateKey={selectedDate}
          events={events}
          actions={actions}
          notes={notes}
          onAddAction={addAction}
          onDeleteAction={deleteAction}
          onAddDayAction={addDayAction}
          onUpdateDayAction={updateDayAction}
          onDeleteDayAction={deleteDayAction}
          onAddNote={addNote}
          onUpdateNote={updateNote}
          onDeleteNote={deleteNote}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* Developer Tools */}
      <DevInspector />

    </div>
  )
}