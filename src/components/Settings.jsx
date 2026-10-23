// src/components/Settings.jsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import {
  DARK_TEXT_SWATCHES,
  WHITE_TEXT_SWATCHES,
  DEFAULT_SWATCH_HEX,
  getColorToken,
} from '../utils/m3Palette'
import DataBackup from './DataBackup'

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  )
}

export default function Settings({
  actions,
  events,
  entries,
  categories,
  notes = [],
  onAddAction,
  onUpdateAction,
  onDeleteAction,
  onImport,
}) {
  // Sub-tabs: 'manage' (Manage recurring actions) vs 'backup' (Backup data)
  const [activeTab, setActiveTab] = useState('manage')

  // Template Creator State (No description textarea)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_SWATCH_HEX)
  const [createError, setCreateError] = useState('')

  // Centered Modal Editor State (Pencil-triggered)
  const [editingAction, setEditingAction] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(DEFAULT_SWATCH_HEX)
  const [editError, setEditError] = useState('')

  // Confirmation Dialog States
  const [saveConfirmDialog, setSaveConfirmDialog] = useState(null)
  const [deleteDialogAction, setDeleteDialogAction] = useState(null)
  const [alsoDeleteEntries, setAlsoDeleteEntries] = useState(false)

  // Color Uniqueness: Luminous Frost (#E0E7FF) stays; others disappear once used
  const usedColors = new Set(actions.map((a) => a.color.toLowerCase()))

  const availableDarkSwatches = DARK_TEXT_SWATCHES.filter(
    (s) => s.hex.toLowerCase() === DEFAULT_SWATCH_HEX.toLowerCase() || !usedColors.has(s.hex.toLowerCase())
  )
  const availableWhiteSwatches = WHITE_TEXT_SWATCHES.filter(
    (s) => !usedColors.has(s.hex.toLowerCase())
  )

  const editingDarkSwatches = DARK_TEXT_SWATCHES.filter(
    (s) =>
      s.hex.toLowerCase() === DEFAULT_SWATCH_HEX.toLowerCase() ||
      (editingAction && s.hex.toLowerCase() === editingAction.color.toLowerCase()) ||
      !usedColors.has(s.hex.toLowerCase())
  )
  const editingWhiteSwatches = WHITE_TEXT_SWATCHES.filter(
    (s) =>
      (editingAction && s.hex.toLowerCase() === editingAction.color.toLowerCase()) ||
      !usedColors.has(s.hex.toLowerCase())
  )

  function handleOpenCreate() {
    setNewName('')
    setNewColor(DEFAULT_SWATCH_HEX)
    setCreateError('')
    setIsCreating(true)
    setEditingAction(null)
  }

  function handleSaveNewTemplate() {
    const trimmed = newName.trim()
    if (!trimmed) {
      setCreateError('Please enter an action name.')
      return
    }

    const isDuplicate = actions.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())
    if (isDuplicate) {
      setCreateError(`"${trimmed}" already exists. Choose a different name.`)
      return
    }

    onAddAction(trimmed, newColor)
    setNewName('')
    setNewColor(DEFAULT_SWATCH_HEX)
    setIsCreating(false)
  }

  function handleStartEdit(action) {
    setEditingAction(action)
    setEditName(action.name)
    setEditColor(action.color || DEFAULT_SWATCH_HEX)
    setEditError('')
  }

  function handlePromptSaveEdit() {
    const trimmed = editName.trim()
    if (!trimmed) {
      setEditError('Please enter an action name.')
      return
    }

    const isDuplicate = actions.some(
      (a) => a.id !== editingAction.id && a.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (isDuplicate) {
      setEditError(`"${trimmed}" already exists. Choose a different name.`)
      return
    }

    setSaveConfirmDialog({
      title: 'Save changes?',
      message: 'This will update the name and color for this action template and all its calendar entries.',
      onConfirm: () => {
        onUpdateAction(editingAction.id, trimmed, editColor)
        setEditingAction(null)
        setSaveConfirmDialog(null)
      },
    })
  }

  function handlePromptDelete(action) {
    setDeleteDialogAction(action)
    setAlsoDeleteEntries(false)
  }

  function handleConfirmDelete() {
    if (!deleteDialogAction) return
    onDeleteAction(deleteDialogAction.id, alsoDeleteEntries)
    setDeleteDialogAction(null)
  }

  // Real-time duplicate matches
  const matchingNewActions = newName.trim()
    ? actions.filter((a) => a.name.toLowerCase().includes(newName.trim().toLowerCase()))
    : []

  const matchingEditActions = editName.trim() && editingAction
    ? actions.filter(
        (a) => a.id !== editingAction.id && a.name.toLowerCase().includes(editName.trim().toLowerCase())
      )
    : []

  return (
    <div className="flex flex-col gap-5 select-none font-sans">
      {/* Settings Sub-Tabs: "Manage recurring actions" vs "Backup data" */}
      <div className="flex rounded-2xl bg-[#EEF2FF] p-1 border border-black/5">
        <button
          type="button"
          onClick={() => {
            setActiveTab('manage')
            setIsCreating(false)
            setEditingAction(null)
          }}
          className={`flex-1 h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
            activeTab === 'manage'
              ? 'bg-[#4F46E5] text-white shadow-xs'
              : 'text-[#1E1B4B] hover:bg-black/5'
          }`}
        >
          Manage recurring actions
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('backup')
            setIsCreating(false)
            setEditingAction(null)
          }}
          className={`flex-1 h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
            activeTab === 'backup'
              ? 'bg-[#4F46E5] text-white shadow-xs'
              : 'text-[#1E1B4B] hover:bg-black/5'
          }`}
        >
          Backup data
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MANAGE RECURRING ACTIONS                           */}
      {/* ========================================================= */}
      {activeTab === 'manage' && (
        <div className="flex flex-col gap-4">
          {/* Top Button: "+ Create new one" */}
          {!isCreating && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="w-full h-11 px-4 rounded-2xl bg-[#EEF2FF] hover:bg-[#C7D2FE] text-[#4F46E5] font-extrabold text-sm tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 border border-black/5"
            >
              <span>+</span>
              <span>Create new one</span>
            </button>
          )}

          {/* Form 1: Inline Create New Action Template */}
          {isCreating && (
            <div className="bg-[#FAF8FF] p-4 rounded-3xl border border-black/10 shadow-xs flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider">
                  Create Action Template
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs font-bold text-[#45464F] hover:text-[#1E1B4B]"
                >
                  Cancel
                </button>
              </div>

              {createError && (
                <p className="text-xs font-semibold text-[#BA1A1A] bg-[#FFDAD6] p-2 rounded-xl">
                  {createError}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value)
                    if (createError) setCreateError('')
                  }}
                  placeholder="Enter action name"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#767680]/30 bg-white text-sm font-semibold text-[#1E1B4B] placeholder-[#767680] focus:outline-none focus:border-[#4F46E5]"
                />

                {matchingNewActions.length > 0 && (
                  <div className="flex flex-col gap-1 pt-0.5">
                    <span className="text-[10px] font-bold text-[#45464F] uppercase tracking-wider">
                      Existing matches ({matchingNewActions.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchingNewActions.map((action) => {
                        const token = getColorToken(action.color)
                        return (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => setNewName(action.name)}
                            title={`Tap to copy "${action.name}"`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-black/10 shadow-2xs transition active:scale-95"
                            style={{
                              backgroundColor: token.hex,
                              color: token.textColor,
                            }}
                          >
                            <span>{action.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2-Row Swatches */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#45464F] uppercase tracking-wider">
                    Light Tints (Dark Text)
                  </span>
                  <div className="flex gap-2 flex-wrap items-center">
                    {availableDarkSwatches.map((swatch) => {
                      const isSelected = newColor.toLowerCase() === swatch.hex.toLowerCase()
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          onClick={() => setNewColor(swatch.hex)}
                          aria-label={swatch.label}
                          className={`w-8 h-8 rounded-full border border-black/15 transition-transform flex items-center justify-center ${
                            isSelected ? 'ring-2 ring-offset-2 ring-[#1E1B4B] scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        >
                          {isSelected && (
                            <svg className="w-4 h-4 text-[#1E1B4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {availableWhiteSwatches.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-[10px] font-bold text-[#45464F] uppercase tracking-wider">
                      Deep Tints (White Text)
                    </span>
                    <div className="flex gap-2 flex-wrap items-center">
                      {availableWhiteSwatches.map((swatch) => {
                        const isSelected = newColor.toLowerCase() === swatch.hex.toLowerCase()
                        return (
                          <button
                            key={swatch.id}
                            type="button"
                            onClick={() => setNewColor(swatch.hex)}
                            aria-label={swatch.label}
                            className={`w-8 h-8 rounded-full border border-black/15 transition-transform flex items-center justify-center ${
                              isSelected ? 'ring-2 ring-offset-2 ring-[#1E1B4B] scale-110' : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: swatch.hex }}
                          >
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveNewTemplate}
                className="w-full h-10 mt-1 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-95 text-white font-bold rounded-xl text-xs transition"
              >
                SAVE TEMPLATE
              </button>
            </div>
          )}

          {/* List of Existing Action Cards */}
          <div className="flex flex-col gap-2.5">
            {actions.map((action) => {
              const token = getColorToken(action.color)

              return (
                <div
                  key={action.id}
                  className="rounded-2xl h-11 px-3.5 shadow-xs flex items-center justify-between border border-black/10 transition"
                  style={{
                    backgroundColor: token.hex,
                    color: token.textColor,
                  }}
                >
                  <span className="text-sm font-bold tracking-tight">
                    {action.name}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(action)}
                      aria-label={`Edit ${action.name} template`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition active:scale-95 hover:bg-black/15"
                      style={{ color: token.textColor }}
                    >
                      <PencilIcon />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePromptDelete(action)}
                      aria-label={`Delete ${action.name} template`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition active:scale-95 hover:bg-black/15"
                      style={{ color: token.textColor }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BACKUP DATA                                        */}
      {/* ========================================================= */}
      {activeTab === 'backup' && (
        <DataBackup
          entries={entries}
          events={events}
          categories={categories}
          actions={actions}
          notes={notes}
          onImport={onImport}
        />
      )}

      {/* ========================================================= */}
      {/* 1. CENTERED EDIT ACTION MODAL DIALOG (createPortal)       */}
      {/* ========================================================= */}
      {editingAction && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[2147483645] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
        >
          <div className="bg-[#FAF8FF] rounded-3xl p-5 shadow-2xl border border-black/10 w-full max-w-sm flex flex-col gap-3.5 font-sans animate-m3-dialog-enter max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider">
                Edit Action Template
              </span>
              <button
                type="button"
                onClick={() => setEditingAction(null)}
                className="text-xs font-bold text-[#45464F] hover:text-[#1E1B4B]"
              >
                Cancel
              </button>
            </div>

            {editError && (
              <p className="text-xs font-semibold text-[#BA1A1A] bg-[#FFDAD6] p-2 rounded-xl">
                {editError}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value)
                  if (editError) setEditError('')
                }}
                placeholder="Enter action name"
                className="w-full h-11 px-3.5 rounded-xl border border-[#767680]/30 bg-white text-sm font-semibold text-[#1E1B4B] placeholder-[#767680] focus:outline-none focus:border-[#4F46E5]"
              />

              {matchingEditActions.length > 0 && (
                <div className="flex flex-col gap-1 pt-0.5">
                  <span className="text-[10px] font-bold text-[#45464F] uppercase tracking-wider">
                    Existing matches ({matchingEditActions.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {matchingEditActions.map((action) => {
                      const token = getColorToken(action.color)
                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => setEditName(action.name)}
                          title={`Tap to copy "${action.name}"`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-black/10 shadow-2xs transition active:scale-95"
                          style={{
                            backgroundColor: token.hex,
                            color: token.textColor,
                          }}
                        >
                          <span>{action.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2-Row Color Swatches with Current Color Pre-Checked */}
            <div className="flex flex-col gap-2">
              {editingDarkSwatches.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#45464F] uppercase tracking-wider">
                    Light Tints (Dark Text)
                  </span>
                  <div className="flex gap-2 flex-wrap items-center">
                    {editingDarkSwatches.map((swatch) => {
                      const isSelected = editColor.toLowerCase() === swatch.hex.toLowerCase()
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          onClick={() => setEditColor(swatch.hex)}
                          aria-label={swatch.label}
                          className={`w-8 h-8 rounded-full border border-black/15 transition-transform flex items-center justify-center ${
                            isSelected ? 'ring-2 ring-offset-2 ring-[#1E1B4B] scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        >
                          {isSelected && (
                            <svg className="w-4 h-4 text-[#1E1B4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {editingWhiteSwatches.length > 0 && (
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-[10px] font-bold text-[#45464F] uppercase tracking-wider">
                    Deep Tints (White Text)
                  </span>
                  <div className="flex gap-2 flex-wrap items-center">
                    {editingWhiteSwatches.map((swatch) => {
                      const isSelected = editColor.toLowerCase() === swatch.hex.toLowerCase()
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          onClick={() => setEditColor(swatch.hex)}
                          aria-label={swatch.label}
                          className={`w-8 h-8 rounded-full border border-black/15 transition-transform flex items-center justify-center ${
                            isSelected ? 'ring-2 ring-offset-2 ring-[#1E1B4B] scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        >
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePromptSaveEdit}
              className="w-full h-11 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-95 text-white font-bold rounded-xl text-xs transition"
            >
              SAVE CHANGES
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 2. CENTERED SAVE CONFIRMATION DIALOG (createPortal)       */}
      {/* ========================================================= */}
      {saveConfirmDialog && typeof document !== 'undefined' && createPortal(
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-[2147483646] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
        >
          <div className="bg-[#FAF8FF] rounded-3xl p-5 shadow-2xl border border-black/10 w-full max-w-xs flex flex-col gap-3 font-sans animate-m3-dialog-enter">
            <h3 className="text-base font-bold text-[#1E1B4B]">
              {saveConfirmDialog.title}
            </h3>
            <p className="text-xs text-[#45464F] leading-relaxed">
              {saveConfirmDialog.message}
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setSaveConfirmDialog(null)}
                className="h-10 px-4 rounded-full bg-[#EEF2FF] hover:bg-[#C7D2FE] text-[#1E1B4B] font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveConfirmDialog.onConfirm}
                className="h-10 px-5 rounded-full font-bold text-xs text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-xs transition"
              >
                Ok
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 3. CENTERED DELETE CONFIRMATION DIALOG (createPortal)     */}
      {/* ========================================================= */}
      {deleteDialogAction && typeof document !== 'undefined' && createPortal(
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-[2147483646] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
        >
          <div className="bg-[#FAF8FF] rounded-3xl p-5 shadow-2xl border border-black/10 w-full max-w-xs flex flex-col gap-3 font-sans animate-m3-dialog-enter">
            <h3 className="text-base font-bold text-[#1E1B4B]">
              Delete event?
            </h3>
            <p className="text-xs text-[#45464F] leading-relaxed">
              Are you sure you want to delete <strong className="text-[#1E1B4B]">{deleteDialogAction.name}</strong>?
            </p>

            <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
              <input
                type="checkbox"
                checked={alsoDeleteEntries}
                onChange={(e) => setAlsoDeleteEntries(e.target.checked)}
                className="w-4 h-4 rounded text-[#BA1A1A] accent-[#BA1A1A] focus:ring-0"
              />
              <span className="text-xs font-semibold text-[#1E1B4B]">
                Also delete all entries
              </span>
            </label>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteDialogAction(null)}
                className="h-10 px-4 rounded-full bg-[#EEF2FF] hover:bg-[#C7D2FE] text-[#1E1B4B] font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-10 px-5 rounded-full font-bold text-xs text-white bg-[#BA1A1A] hover:bg-[#93000A] shadow-xs transition"
              >
                Ok
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

Settings.propTypes = {
  actions:        PropTypes.arrayOf(PropTypes.object).isRequired,
  events:         PropTypes.arrayOf(PropTypes.object).isRequired,
  entries:        PropTypes.objectOf(PropTypes.object).isRequired,
  categories:     PropTypes.arrayOf(PropTypes.object).isRequired,
  notes:          PropTypes.arrayOf(PropTypes.object),
  onAddAction:    PropTypes.func.isRequired,
  onUpdateAction: PropTypes.func.isRequired,
  onDeleteAction: PropTypes.func.isRequired,
  onImport:       PropTypes.func.isRequired,
}