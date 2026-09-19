// src/components/DataBackup.jsx
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
      // Manual copy fallback remains available in the textarea below
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
          setImportError("This file does not match a valid My Diary backup format.")
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
        setImportError("Unable to parse file. Please select a valid .json backup file.")
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
    <section aria-label="Backup and restore" className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-[#1E1B4B]">Backup &amp; Restore</h2>
        <p className="text-xs text-[#45464F] mt-0.5">
          Your diary entries reside solely on this device. Export regular backups to prevent accidental data loss.
        </p>
      </div>

      {/* Export Card */}
      <div className="bg-[#FAF8FF] rounded-3xl p-5 shadow-xs border border-black/5 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#1E1B4B]">Export Data</h3>
          <p className="text-xs font-semibold text-[#45464F] mt-0.5">
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'} · {eventCount} {eventCount === 1 ? 'event' : 'events'} · {categoryCount} {categoryCount === 1 ? 'category' : 'categories'}
          </p>
        </div>

        <button
          onClick={handleExport}
          className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-98 text-white font-bold rounded-full text-sm shadow-sm transition flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4F46E5]"
        >
          Download Backup File
        </button>

        {exportedText && (
          <div className="flex flex-col gap-1.5 pt-1">
            <label htmlFor="export-text" className="text-xs font-bold text-[#45464F]">
              Direct JSON Backup (tap to select all and copy):
            </label>
            <textarea
              id="export-text"
              readOnly
              value={exportedText}
              rows={4}
              onFocus={e => e.target.select()}
              className="w-full rounded-2xl border border-[#767680]/30 bg-white p-3 text-xs font-mono text-[#1E1B4B] resize-none focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 shadow-xs"
            />
          </div>
        )}
      </div>

      {/* Import Card */}
      <div className="bg-[#FAF8FF] rounded-3xl p-5 shadow-xs border border-black/5 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#1E1B4B]">Restore Data</h3>
          <p className="text-xs text-[#45464F] mt-0.5">
            Select a previous JSON backup to restore. Existing dates with same-day notes will be updated.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
          aria-label="Choose backup file to restore"
          className="text-xs text-[#45464F] file:mr-3 file:h-11 file:px-5 file:rounded-full file:border-0 file:bg-[#EEF2FF] file:text-[#1E1B4B] file:text-xs file:font-bold hover:file:bg-[#C7D2FE] file:transition file:cursor-pointer"
        />

        {importError && (
          <div
            className="bg-[#FFDAD6] border border-[#BA1A1A]/20 text-[#410002] px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2"
            role="alert"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{importError}</span>
          </div>
        )}
      </div>

      {/* M3 Restore Confirmation Modal Sheet */}
      {pendingImport && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm restore"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-2 sm:p-4"
        >
          <div className="bg-[#FAF8FF] rounded-3xl w-full max-w-sm shadow-2xl p-5 border border-black/5 flex flex-col gap-4">
            <h3 className="text-base font-bold text-[#1E1B4B]">Restore Backup?</h3>
            <p className="text-xs text-[#45464F] leading-relaxed">
              This backup file contains <strong className="text-[#1E1B4B]">{pendingImport.summary.entries}</strong> entries, <strong className="text-[#1E1B4B]">{pendingImport.summary.events}</strong> events, and <strong className="text-[#1E1B4B]">{pendingImport.summary.categories}</strong> categories. Existing data on identical dates will be overwritten.
            </p>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setPendingImport(null)}
                className="flex-1 h-12 bg-[#EEF2FF] hover:bg-[#C7D2FE] active:scale-98 text-[#1E1B4B] font-bold rounded-full text-xs transition flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 h-12 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-98 text-white font-bold rounded-full text-xs shadow-sm transition flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4F46E5]"
              >
                Confirm Restore
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