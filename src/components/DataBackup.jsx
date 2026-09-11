import { useState, useRef } from 'react'
import PropTypes from 'prop-types'

function buildExportPayload(entries, events, categories) {
  return {
    app: 'My Diary',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    events,
    categories,
  }
}

export default function DataBackup({ entries, events, categories, onImport }) {
  const [exportedText, setExportedText] = useState(null)
  const [pendingImport, setPendingImport] = useState(null)
  const [importError, setImportError] = useState(null)
  const fileInputRef = useRef(null)

  const entryCount = Object.keys(entries).length
  const eventCount = events.length
  const categoryCount = categories.length

  function handleExport() {
    const payload = buildExportPayload(entries, events, categories)
    const json = JSON.stringify(payload, null, 2)
    setExportedText(json)

    try {
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const dateStamp = new Date().toISOString().slice(0, 10)
      link.download = `my-diary-backup-${dateStamp}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      // Download may not trigger on every device — the text box below
      // still lets you copy the backup manually.
    }
  }

  function handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        const looksValid =
          typeof data === 'object' && data !== null &&
          typeof data.entries === 'object' && data.entries !== null &&
          Array.isArray(data.events) &&
          Array.isArray(data.categories)

        if (!looksValid) {
          setImportError("This file doesn't look like a diary backup.")
          return
        }

        setPendingImport({
          data,
          summary: {
            entries: Object.keys(data.entries).length,
            events: data.events.length,
            categories: data.categories.length,
          },
        })
      } catch {
        setImportError("Couldn't read that file — make sure it's a valid backup .json file.")
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function confirmImport() {
    onImport(pendingImport.data)
    setPendingImport(null)
  }

  return (
    <section aria-label="Backup and restore" className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Backup &amp; Restore</h2>
        <p className="text-xs text-gray-500 mt-1">
          Your notes only live on this device. Export a backup before reinstalling the app, or anytime after making important entries.
        </p>
      </div>

      {/* Export */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Export</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'} · {eventCount} {eventCount === 1 ? 'event' : 'events'} · {categoryCount} {categoryCount === 1 ? 'category' : 'categories'}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-medium rounded-xl py-2.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        >
          Download backup file
        </button>
        {exportedText && (
          <div>
            <label htmlFor="export-text" className="block text-xs text-gray-500 mb-1">
              If the download didn&rsquo;t save anywhere you can find, tap the box below to select all, then copy it manually:
            </label>
            <textarea
              id="export-text"
              readOnly
              value={exportedText}
              rows={4}
              onFocus={e => e.target.select()}
              className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Import */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Restore</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose a previously exported backup file. Entries on the same date will be replaced by the backup&rsquo;s version.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
          aria-label="Choose backup file to restore"
          className="text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs file:font-medium hover:file:bg-gray-200"
        />
        {importError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{importError}</p>
        )}
      </div>

      {/* Confirm import dialog */}
      {pendingImport && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm restore"
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-4 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-gray-800">Restore this backup?</h3>
            <p className="text-sm text-gray-600">
              This file has {pendingImport.summary.entries} {pendingImport.summary.entries === 1 ? 'entry' : 'entries'}, {pendingImport.summary.events} {pendingImport.summary.events === 1 ? 'event' : 'events'}, and {pendingImport.summary.categories} {pendingImport.summary.categories === 1 ? 'category' : 'categories'}. It will be merged into what you have now — any entry on the same date will be replaced by the backup&rsquo;s version.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingImport(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-medium rounded-xl py-2.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-medium rounded-xl py-2.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  )
}

DataBackup.propTypes = {
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
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id:    PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
  onImport: PropTypes.func.isRequired,
}