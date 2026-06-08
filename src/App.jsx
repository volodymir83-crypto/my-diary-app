import { useState } from 'react'
import { useDiary } from './hooks/useDiary'
import Calendar   from './components/Calendar'
import DiaryEntry from './components/DiaryEntry'
import History    from './components/History'
import Search     from './components/Search'
import Categories from './components/Categories'

const TABS = [
  { key: 'calendar',   icon: '📅', label: 'Calendar'   },
  { key: 'history',    icon: '📋', label: 'History'    },
  { key: 'search',     icon: '🔍', label: 'Search'     },
  { key: 'settings',   icon: '⚙️',  label: 'Settings'   },
]

export default function App() {
  const {
    entries, events, categories,
    saveEntry, deleteEntry,
    addEvent, deleteEvent,
    addCategory, deleteCategory,
  } = useDiary()

  const [selectedDate, setSelectedDate] = useState(null)
  const [view,         setView]         = useState('calendar')

  const selectedEntry  = selectedDate ? entries[selectedDate] ?? null : null
  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : []

  function handleSelectDate(dateKey) {
    setSelectedDate(dateKey)
    setView('calendar')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 text-center">
          📓 My Diary
        </h1>
      </header>

      {/* Main */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full pb-20">
        {view === 'calendar' && (
          <Calendar
            entries={entries}
            events={events}
            onSelectDate={setSelectedDate}
          />
        )}
        {view === 'history' && (
          <History
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
          <Categories
            categories={categories}
            onAdd={addCategory}
            onDelete={deleteCategory}
          />
        )}
      </main>

      {/* Bottom navigation */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex"
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            aria-current={view === tab.key ? 'page' : undefined}
            className={[
              'flex-1 flex flex-col items-center py-3 text-xs font-medium transition',
              view === tab.key ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            <span className="text-xl mb-0.5" aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Diary modal */}
      {selectedDate && (
        <DiaryEntry
          dateKey={selectedDate}
          entry={selectedEntry}
          events={selectedEvents}
          categories={categories}
          onSave={saveEntry}
          onDelete={deleteEntry}
          onAddEvent={addEvent}
          onDeleteEvent={deleteEvent}
          onClose={() => setSelectedDate(null)}
        />
      )}

    </div>
  )
}