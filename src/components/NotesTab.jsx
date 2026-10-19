// src/components/NotesTab.jsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'

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

export default function NotesTab({
  dateKey,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) {
  // Modal editor state (Opens at center of screen)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState(null)

  const dayNotes = notes.filter((n) => n.date === dateKey)

  function handleOpenAddNote() {
    setEditingNoteId(null)
    setNoteTitle('')
    setNoteContent('')
    setIsEditorOpen(true)
  }

  function handleStartEditNote(noteItem) {
    setEditingNoteId(noteItem.id)
    setNoteTitle(noteItem.title || '')
    setNoteContent(noteItem.content || '')
    setIsEditorOpen(true)
  }

  function handleCancelEditor() {
    setEditingNoteId(null)
    setNoteTitle('')
    setNoteContent('')
    setIsEditorOpen(false)
  }

  // Confirmation prompt before saving note edits
  function handlePromptSaveNote() {
    if (!noteContent.trim() && !noteTitle.trim()) return

    if (editingNoteId) {
      setConfirmDialog({
        type: 'save',
        title: 'Save changes?',
        message: 'Do you want to update this note?',
        onConfirm: () => {
          onUpdateNote(editingNoteId, noteTitle, noteContent)
          handleCancelEditor()
          setConfirmDialog(null)
        },
      })
    } else {
      onAddNote(dateKey, noteTitle, noteContent)
      handleCancelEditor()
    }
  }

  // Confirmation prompt before deleting a note
  function handlePromptDeleteNote(noteItem) {
    setConfirmDialog({
      type: 'delete',
      title: 'Delete note?',
      message: `Are you sure you want to delete "${noteItem.title || 'this note'}"?`,
      onConfirm: () => {
        onDeleteNote(noteItem.id)
        setConfirmDialog(null)
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Note Count and Add Button */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#45464F] uppercase tracking-wider">
          {dayNotes.length} {dayNotes.length === 1 ? 'note' : 'notes'}
        </span>
        <button
          type="button"
          onClick={handleOpenAddNote}
          className="h-8 px-4 rounded-full bg-[#EEF2FF] hover:bg-[#C7D2FE] text-[#4F46E5] font-extrabold text-xs transition active:scale-95"
        >
          + Add
        </button>
      </div>

      {/* List of Existing Notes (Read-only body with 10-line max height) */}
      {dayNotes.length > 0 ? (
        <div className="flex flex-col gap-2">
          {dayNotes.map((noteItem) => (
            <div
              key={noteItem.id}
              className="bg-white p-3.5 rounded-2xl border border-black/10 shadow-2xs flex flex-col gap-1 relative"
            >
              <div className="flex items-center justify-between pr-16">
                {noteItem.title ? (
                  <h4 className="text-xs font-bold text-[#1E1B4B]">{noteItem.title}</h4>
                ) : (
                  <span className="text-[10px] text-[#767680] italic">Untitled Note</span>
                )}
              </div>

              {/* Read-Only text content (Capped at 10 lines max) */}
              <p className="text-xs font-medium text-[#45464F] whitespace-pre-line mt-0.5 max-h-[15em] overflow-y-auto select-text">
                {noteItem.content}
              </p>

              {/* Action Buttons: Pencil (Edit) & Trash (Delete) */}
              <div className="absolute top-2.5 right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleStartEditNote(noteItem)}
                  aria-label={`Edit ${noteItem.title || 'note'}`}
                  className="w-7 h-7 rounded-lg text-[#767680] hover:text-[#1E1B4B] hover:bg-black/5 active:scale-95 flex items-center justify-center transition"
                >
                  <PencilIcon />
                </button>

                <button
                  type="button"
                  onClick={() => handlePromptDeleteNote(noteItem)}
                  aria-label={`Delete ${noteItem.title || 'note'}`}
                  className="w-7 h-7 rounded-lg text-[#767680] hover:text-[#1E1B4B] hover:bg-black/5 active:scale-95 flex items-center justify-center transition"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#767680] italic text-center py-4">
          No notes logged for this day yet.
        </p>
      )}

      {/* ========================================================= */}
      {/* 1. CENTERED NOTE EDITOR MODAL (Add & Edit)                */}
      {/* ========================================================= */}
      {isEditorOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[2147483645] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
        >
          <div className="bg-[#FAF8FF] rounded-3xl p-5 shadow-2xl border border-black/10 w-full max-w-sm flex flex-col gap-3.5 font-sans animate-m3-dialog-enter">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider">
                {editingNoteId ? 'Edit Note' : 'New Note'}
              </span>
              <button
                type="button"
                onClick={handleCancelEditor}
                className="text-xs font-bold text-[#45464F] hover:text-[#1E1B4B]"
              >
                Cancel
              </button>
            </div>

            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Name the note (optional)"
              className="w-full h-11 px-3.5 rounded-xl border border-[#767680]/30 bg-white text-sm font-semibold text-[#1E1B4B] placeholder-[#767680] focus:outline-none focus:border-[#4F46E5]"
            />

            <textarea
              rows={6}
              enterKeyHint="enter"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Tell what happened today..."
              className="w-full rounded-xl border border-[#767680]/30 bg-white p-3 text-sm font-semibold text-[#1E1B4B] placeholder-[#767680] resize-none focus:outline-none focus:border-[#4F46E5]"
            />

            <button
              type="button"
              onClick={handlePromptSaveNote}
              disabled={!noteContent.trim() && !noteTitle.trim()}
              className="w-full h-11 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-95 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition"
            >
              {editingNoteId ? 'UPDATE NOTE' : 'SAVE'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 2. CENTERED CONFIRMATION DIALOG                           */}
      {/* ========================================================= */}
      {confirmDialog && typeof document !== 'undefined' && createPortal(
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-note-dialog-title"
          className="fixed inset-0 z-[2147483646] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
        >
          <div className="bg-[#FAF8FF] rounded-3xl p-5 shadow-2xl border border-black/10 w-full max-w-xs flex flex-col gap-3 font-sans animate-m3-dialog-enter">
            <h3 id="confirm-note-dialog-title" className="text-base font-bold text-[#1E1B4B]">
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

NotesTab.propTypes = {
  dateKey: PropTypes.string.isRequired,
  notes: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAddNote: PropTypes.func.isRequired,
  onUpdateNote: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired,
}