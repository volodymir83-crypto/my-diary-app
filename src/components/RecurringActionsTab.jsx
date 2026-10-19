// src/components/RecurringActionsTab.jsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import {
  DARK_TEXT_SWATCHES,
  WHITE_TEXT_SWATCHES,
  DEFAULT_SWATCH_HEX,
  getColorToken,
} from '../utils/m3Palette'

// Subtle Grey Trash Can Icon
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

// Subtle Grey Edit Pencil Icon
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

export default function RecurringActionsTab({
  dateKey,
  events,
  actions,
  onAddAction,
  onAddDayAction,
  onUpdateDayAction,
  onDeleteDayAction,
}) {
  // Main Selection & Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedActionId, setSelectedActionId] = useState('')
  const [activityDescription, setActivityDescription] = useState('')

  // Merged 1-Step Action Creator State
  const [isCreatingAction, setIsCreatingAction] = useState(false)
  const [newActionName, setNewActionName] = useState('')
  const [newActionColor, setNewActionColor] = useState(DEFAULT_SWATCH_HEX)
  const [newActionDescription, setNewActionDescription] = useState('')
  const [createError, setCreateError] = useState('')

  // Action Description Editor State (Only text is editable per-day)
  const [editingEvent, setEditingEvent] = useState(null)
  const [editDescription, setEditDescription] = useState('')

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState(null)

  const dayEvents = events.filter((e) => e.date === dateKey)
  const activeTemplate = actions.find((a) => a.id === selectedActionId)

  // Luminous Frost permanently available; other 15 colors follow 1 activity = 1 color rule
  const usedColors = new Set(actions.map((a) => a.color.toLowerCase()))
  const availableDarkSwatches = DARK_TEXT_SWATCHES.filter(
    (s) => s.hex.toLowerCase() === DEFAULT_SWATCH_HEX.toLowerCase() || !usedColors.has(s.hex.toLowerCase())
  )
  const availableWhiteSwatches = WHITE_TEXT_SWATCHES.filter(
    (s) => !usedColors.has(s.hex.toLowerCase())
  )

  function handleOpenCreateAction() {
    setNewActionName('')
    setNewActionColor(DEFAULT_SWATCH_HEX)
    setNewActionDescription('')
    setCreateError('')
    setIsCreatingAction(true)
    setIsDropdownOpen(false)
  }

  // Merged 1-Step Action Creator with duplicate name validation
  function handleSaveNewActionTemplate() {
    const trimmed = newActionName.trim()
    if (!trimmed) {
      setCreateError('Please enter an activity name.')
      return
    }

    // Prevent creating duplicate action names
    const isDuplicate = actions.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())
    if (isDuplicate) {
      setCreateError(`"${trimmed}" already exists. Choose a different name.`)
      return
    }

    setCreateError('')
    const created = onAddAction(trimmed, newActionColor)
    onAddDayAction(dateKey, created.id, newActionDescription, created.name, created.color)

    setNewActionName('')
    setNewActionColor(DEFAULT_SWATCH_HEX)
    setNewActionDescription('')
    setIsCreatingAction(false)
    setIsDropdownOpen(false)
    setSelectedActionId('') // Return to "Choose action" placeholder
  }

  // Real-time matching existing actions
  const matchingActions = newActionName.trim()
    ? actions.filter((a) => a.name.toLowerCase().includes(newActionName.trim().toLowerCase()))
    : []

  // Logs existing action from dropdown
  function handleLogDayAction() {
    if (!selectedActionId) return

    onAddDayAction(dateKey, selectedActionId, activityDescription)
    setActivityDescription('')
    setSelectedActionId('')
  }

  // Starts editing description for a logged action
  function handleStartEditDescription(event) {
    setEditingEvent(event)
    setEditDescription(event.description || '')
  }

  // Confirmation prompt before saving description edits
  function handlePromptSaveDescription() {
    setConfirmDialog({
      type: 'save',
      title: 'Save changes?',
      message: 'Do you want to update the description for this activity?',
      onConfirm: () => {
        onUpdateDayAction(editingEvent.id, editingEvent.title, editingEvent.color, editDescription)
        setEditingEvent(null)
        setConfirmDialog(null)
      },
    })
  }

  // Confirmation prompt before deleting a logged action
  function handlePromptDeleteEvent(event) {
    setConfirmDialog({
      type: 'delete',
      title: 'Delete event?',
      message: `Are you sure you want to remove "${event.title}" from this day?`,
      onConfirm: () => {
        onDeleteDayAction(event.id)
        setConfirmDialog(null)
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ========================================================= */}
      {/* 1. EDIT DESCRIPTION WINDOW (Pencil Triggered)             */}
      {/* ========================================================= */}
      {editingEvent ? (
        <div className="bg-[#EEF2FF] p-4 rounded-2xl border border-black/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span
              className="px-2.5 py-1 rounded-md text-xs font-bold leading-tight shadow-2xs"
              style={{
                backgroundColor: getColorToken(editingEvent.color)?.hex || '#4F46E5',
                color: getColorToken(editingEvent.color)?.textColor || '#FFFFFF',
              }}
            >
              {editingEvent.title}
            </span>
            <button
              type="button"
              onClick={() => setEditingEvent(null)}
              className="text-xs font-bold text-[#45464F] hover:text-[#1E1B4B]"
            >
              Cancel
            </button>
          </div>

          <textarea
            rows={5}
            enterKeyHint="enter"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Describe the activity (Enter for new lines)..."
            className="w-full rounded-xl border border-[#767680]/30 bg-white p-3 text-xs font-medium text-[#1E1B4B] placeholder-[#767680] resize-none focus:outline-none focus:border-[#4F46E5]"
          />

          <button
            type="button"
            onClick={handlePromptSaveDescription}
            className="w-full h-10 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-95 text-white font-bold rounded-xl text-xs transition"
          >
            SAVE
          </button>
        </div>
      ) : isCreatingAction ? (
        /* ========================================================= */
        /* 2. MERGED 1-STEP CREATION WINDOW                          */
        /* ========================================================= */
        <div className="bg-[#EEF2FF] p-4 rounded-2xl border border-black/5 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider">
              Create New Action
            </span>
            <button
              type="button"
              onClick={() => setIsCreatingAction(false)}
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
              value={newActionName}
              onChange={(e) => {
                setNewActionName(e.target.value)
                if (createError) setCreateError('')
              }}
              placeholder="Enter activity name"
              className="w-full h-11 px-3.5 rounded-xl border border-[#767680]/30 bg-white text-sm font-semibold text-[#1E1B4B] placeholder-[#767680] focus:outline-none focus:border-[#4F46E5]"
            />

            {/* Real-Time Duplicate Prevention Suggestion Chips */}
            {matchingActions.length > 0 && (
              <div className="flex flex-col gap-1 pt-0.5">
                <span className="text-[10px] font-bold text-[#45464F] uppercase tracking-wider">
                  Existing matches ({matchingActions.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchingActions.map((action) => {
                    const token = getColorToken(action.color)
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => setNewActionName(action.name)}
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


          {/* 2-Row Color Swatches */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#45464F] uppercase tracking-wider">
                Light Tints (Dark Text)
              </span>
              <div className="flex gap-2 flex-wrap items-center">
                {availableDarkSwatches.map((swatch) => {
                  const isSelected = newActionColor.toLowerCase() === swatch.hex.toLowerCase()
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => setNewActionColor(swatch.hex)}
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
                    const isSelected = newActionColor.toLowerCase() === swatch.hex.toLowerCase()
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => setNewActionColor(swatch.hex)}
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

          <textarea
            rows={3}
            enterKeyHint="enter"
            value={newActionDescription}
            onChange={(e) => setNewActionDescription(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Describe the activity (optional)"
            className="w-full rounded-xl border border-[#767680]/30 bg-white p-3 text-sm font-semibold text-[#1E1B4B] placeholder-[#767680] resize-none focus:outline-none focus:border-[#4F46E5]"
          />

          <button
            type="button"
            onClick={handleSaveNewActionTemplate}
            className="w-full h-10 mt-1 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-95 text-white font-bold rounded-xl text-xs transition"
          >
            SAVE
          </button>
        </div>
      ) : (
        /* ========================================================= */
        /* 3. MAIN FLOW: "Choose action" Selector                    */
        /* ========================================================= */
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full h-12 px-4 rounded-2xl border border-[#767680]/30 bg-white flex items-center justify-between text-sm font-bold text-[#1E1B4B] shadow-xs"
            >
              {activeTemplate ? (
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: activeTemplate.color }}
                  />
                  <span>{activeTemplate.name}</span>
                </div>
              ) : (
                <span className="text-[#45464F] font-semibold">Choose action</span>
              )}
              <span className="text-[#45464F] text-xs font-bold">
                {isDropdownOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* In-Flow Menu Options (Colored sections with locked flex-shrink-0 heights) */}
            {isDropdownOpen && (
              <div className="bg-[#FAF8FF] border border-black/10 rounded-2xl p-2 flex flex-col gap-1.5 shadow-xs max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={handleOpenCreateAction}
                  className="w-full h-10 flex-shrink-0 px-3 rounded-xl bg-[#EEF2FF] hover:bg-[#C7D2FE] text-[#4F46E5] font-extrabold text-xs tracking-wider flex items-center justify-center gap-1.5 transition active:scale-98"
                >
                  <span>+</span>
                  <span>CREATE NEW ONE</span>
                </button>

                {actions.map((action) => {
                  const token = getColorToken(action.color)
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        setSelectedActionId(action.id)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full min-h-[44px] flex-shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-2xs border border-black/10 text-left transition active:scale-98 flex items-center justify-between"
                      style={{
                        backgroundColor: token ? token.hex : '#4F46E5',
                        color: token ? token.textColor : '#FFFFFF',
                      }}
                    >
                      <span>{action.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Conditional Inputs: Appears ONLY when an action is selected */}
          {selectedActionId && (
            <div className="flex flex-col gap-3 pt-1">
              <textarea
                rows={3}
                enterKeyHint="enter"
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Describe the activity"
                className="w-full rounded-2xl border border-[#767680]/30 bg-white p-3.5 text-sm font-semibold text-[#1E1B4B] placeholder-[#767680] resize-none focus:outline-none focus:border-[#4F46E5]"
              />

              <button
                type="button"
                onClick={handleLogDayAction}
                className="w-full h-11 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-95 text-white font-bold rounded-full text-xs shadow-sm transition flex items-center justify-center"
              >
                SAVE
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. LOGGED ACTIONS LIST (Compact Rows & Static Views)      */}
      {/* ========================================================= */}
      {dayEvents.length > 0 && !editingEvent && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-black/5">
          <span className="text-xs font-bold text-[#45464F] uppercase tracking-wider">
            Logged Actions Today ({dayEvents.length})
          </span>

          <div className="flex flex-col gap-2">
            {dayEvents.map((event) => {
              const token = getColorToken(event.color)
              const hasDesc = Boolean(event.description && event.description.trim().length > 0)

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border border-black/10 p-2.5 shadow-2xs flex flex-col gap-2"
                >
                  {/* Top Row: Colored Action Pill + Grey Icons (Pencil & Trash) */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2.5 py-1 rounded-md text-xs font-bold leading-tight shadow-2xs flex-shrink-0"
                      style={{
                        backgroundColor: token ? token.hex : '#4F46E5',
                        color: token ? token.textColor : '#FFFFFF',
                      }}
                    >
                      {event.title}
                    </span>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditDescription(event)}
                        aria-label={`Edit description for ${event.title}`}
                        className="w-7 h-7 rounded-lg text-[#767680] hover:text-[#1E1B4B] hover:bg-black/5 active:scale-95 flex items-center justify-center transition"
                      >
                        <PencilIcon />
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePromptDeleteEvent(event)}
                        aria-label={`Remove ${event.title}`}
                        className="w-7 h-7 rounded-lg text-[#767680] hover:text-[#1E1B4B] hover:bg-black/5 active:scale-95 flex items-center justify-center transition"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  {/* Read-Only Description Container (Max 10 lines) */}
                  {hasDesc && (
                    <div className="text-xs font-medium text-[#45464F] whitespace-pre-wrap max-h-[15em] overflow-y-auto bg-white p-2.5 rounded-xl  border-black/5 select-text">
                      {event.description}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. M3 CONFIRMATION DIALOG (Teleported directly to Body)   */}
      {/* ========================================================= */}
      {confirmDialog && typeof document !== 'undefined' && createPortal(
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-action-dialog-title"
          className="fixed inset-0 z-[2147483646] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
        >
          <div className="bg-[#FAF8FF] rounded-3xl p-5 shadow-2xl border border-black/10 w-full max-w-xs flex flex-col gap-3 font-sans animate-m3-dialog-enter">
            <h3 id="confirm-action-dialog-title" className="text-base font-bold text-[#1E1B4B]">
              {confirmDialog.title}
            </h3>
            {confirmDialog.message && (
              <p className="text-xs text-[#45464F] leading-relaxed">
                {confirmDialog.message}
              </p>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="h-10 px-4 rounded-full bg-[#EEF2FF] hover:bg-[#C7D2FE] text-[#1E1B4B] font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`h-10 px-5 rounded-full font-bold text-xs text-white shadow-xs transition ${
                  confirmDialog.type === 'delete'
                    ? 'bg-[#BA1A1A] hover:bg-[#93000A]'
                    : 'bg-[#4F46E5] hover:bg-[#4338CA]'
                }`}
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

RecurringActionsTab.propTypes = {
  dateKey:                      PropTypes.string.isRequired,
  events:                       PropTypes.arrayOf(PropTypes.object).isRequired,
  actions:                      PropTypes.arrayOf(PropTypes.object).isRequired,
  onAddAction:                  PropTypes.func.isRequired,
  onAddDayAction:               PropTypes.func.isRequired,
  onUpdateDayAction:            PropTypes.func.isRequired,
  onDeleteDayAction:            PropTypes.func.isRequired,
}