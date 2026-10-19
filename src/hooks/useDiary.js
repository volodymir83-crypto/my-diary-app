// src/hooks/useDiary.js
import { useState, useEffect } from "react"
import { DEFAULT_SWATCH_HEX } from "../utils/m3Palette"

const ACTIONS_KEY    = "diary_actions"
const EVENTS_KEY     = "diary_events"
const NOTES_KEY      = "diary_notes"
const ENTRIES_KEY    = "diary_entries"

// Default Action Templates with unique AAA palette colors
const DEFAULT_ACTIONS = [
  { id: 'act-legs',   name: 'Legs',   color: '#B50000' }, // Crimson (White text)
  { id: 'act-pull',   name: 'Pull',   color: '#1C3FE0' }, // Royal Cobalt (White text)
  { id: 'act-push',   name: 'Push',   color: '#E0A500' }, // Marigold (Dark text)
  { id: 'act-cardio', name: 'Cardio', color: '#006700' }, // Emerald Green (White text)
]

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function useDiary() {
  // 1. Action Presets / Templates (Recurring Actions)
  const [actions, setActions] = useState(() => {
    const saved = load(ACTIONS_KEY, null)
    if (saved && Array.isArray(saved) && saved.length > 0) return saved

    const legacyCategories = load("diary_categories", null)
    if (legacyCategories && Array.isArray(legacyCategories) && legacyCategories.length > 0) {
      return legacyCategories.map(cat => ({
        id: cat.id || `act-${Date.now()}`,
        name: cat.label || 'Action',
        color: cat.color || DEFAULT_SWATCH_HEX,
      }))
    }

    return DEFAULT_ACTIONS
  })

  // 2. Day Actions (Events logged on dates)
  const [events, setEvents] = useState(() => load(EVENTS_KEY, []))

  // 3. Multi-note Journal entries
  const [notes, setNotes] = useState(() => {
    const savedNotes = load(NOTES_KEY, null)
    if (savedNotes && Array.isArray(savedNotes)) return savedNotes

    const legacyEntries = load(ENTRIES_KEY, {})
    const migrated = []
    Object.entries(legacyEntries).forEach(([dateKey, entry]) => {
      if (entry?.note && entry.note.trim().length > 0) {
        migrated.push({
          id: `note-${dateKey}-${Date.now()}`,
          date: dateKey,
          title: '',
          content: entry.note.trim(),
          createdAt: new Date().toISOString(),
        })
      }
    })
    return migrated
  })

  // 4. Legacy entries bridge
  const [entries, setEntries] = useState(() => load(ENTRIES_KEY, {}))

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions))
  }, [actions])

  useEffect(() => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
  }, [entries])

  // --- Action Preset Management (Template CRUD) ---

  function addAction(name, color) {
    const newAction = {
      id: `act-${Date.now()}`,
      name: name.trim(),
      color: color || DEFAULT_SWATCH_HEX,
    }
    setActions(prev => [...prev, newAction])
    return newAction
  }

  function updateAction(id, name, color) {
    setActions(prev => prev.map(a => a.id === id ? { ...a, name: name.trim(), color } : a))
    setEvents(prev => prev.map(e => e.actionId === id ? { ...e, title: name.trim(), color } : e))
  }

  function deleteAction(id, deleteAssociatedEvents = false) {
    setActions(prev => prev.filter(a => a.id !== id))
    if (deleteAssociatedEvents) {
      setEvents(prev => prev.filter(e => e.actionId !== id))
    }
  }

  // --- Day Action Logging & Full In-Place Updates ---

  function addDayAction(dateKey, actionId, description = '', customTitle = null, customColor = null) {
    const template = actions.find(a => a.id === actionId)
    const newEvent = {
      id: Date.now(),
      date: dateKey,
      actionId: actionId || (template ? template.id : null),
      title: customTitle || (template ? template.name : 'Action'),
      color: customColor || (template ? template.color : DEFAULT_SWATCH_HEX),
      description: description ? description.trim() : '',
    }
    setEvents(prev => [...prev, newEvent])
    return newEvent
  }

  // Updates title, color, and description of a day action, and keeps template in sync
  function updateDayAction(id, title, color, description) {
    let linkedActionId = null

    setEvents(prev => prev.map(e => {
      if (e.id === id) {
        linkedActionId = e.actionId
        return {
          ...e,
          ...(title ? { title: title.trim() } : {}),
          ...(color ? { color } : {}),
          description: description !== undefined ? description : e.description,
        }
      }
      return e
    }))

    // Keep parent template in sync if linked
    if (linkedActionId && (title || color)) {
      setActions(prev => prev.map(a => {
        if (a.id === linkedActionId) {
          return {
            ...a,
            ...(title ? { name: title.trim() } : {}),
            ...(color ? { color } : {}),
          }
        }
        return a
      }))
    }
  }

  function deleteDayAction(id) {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  // --- Multi-Note Management ---

  function addNote(dateKey, title = '', content = '') {
    if (!content.trim() && !title.trim()) return

    const newNote = {
      id: `note-${Date.now()}`,
      date: dateKey,
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    }

    setNotes(prev => [...prev, newNote])

    setEntries(prev => {
      const existing = prev[dateKey] || {}
      return {
        ...prev,
        [dateKey]: {
          ...existing,
          note: content.trim(),
        }
      }
    })

    return newNote
  }

  function updateNote(id, title = '', content = '') {
    setNotes(prev => prev.map(n => n.id === id ? {
      ...n,
      title: title.trim(),
      content: content.trim(),
    } : n))

    const target = notes.find(n => n.id === id)
    if (target) {
      setEntries(prev => ({
        ...prev,
        [target.date]: {
          ...(prev[target.date] || {}),
          note: content.trim(),
        }
      }))
    }
  }

  function deleteNote(id) {
    const target = notes.find(n => n.id === id)
    setNotes(prev => prev.filter(n => n.id !== id))

    if (target) {
      setEntries(prev => {
        const next = { ...prev }
        delete next[target.date]
        return next
      })
    }
  }

  // Legacy Compatibility Bridge
  function saveEntry(dateKey, noteText, color, category) {
    setEntries(prev => ({ ...prev, [dateKey]: { note: noteText, color, category } }))
  }

  function deleteEntry(dateKey) {
    setEntries(prev => {
      const next = { ...prev }
      delete next[dateKey]
      return next
    })
    setNotes(prev => prev.filter(n => n.date !== dateKey))
  }

  function addEvent(dateKey, title, color) {
    setEvents(prev => [...prev, { id: Date.now(), date: dateKey, title, color }])
  }

  function deleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  function addCategory(label, color) {
    return addAction(label, color)
  }

  function deleteCategory(id) {
    return deleteAction(id)
  }

  function importData({ entries: importedEntries, events: importedEvents, categories: importedCategories }) {
    if (importedEntries) setEntries(prev => ({ ...prev, ...importedEntries }))
    if (importedEvents) {
      setEvents(prev => {
        const existingIds = new Set(prev.map(e => e.id))
        const newOnes = importedEvents.filter(e => !existingIds.has(e.id))
        return [...prev, ...newOnes]
      })
    }
    if (importedCategories) {
      setActions(prev => {
        const merged = [...prev]
        importedCategories.forEach(cat => {
          const idx = merged.findIndex(c => c.id === cat.id)
          if (idx === -1) merged.push({ id: cat.id, name: cat.label || cat.name, color: cat.color })
          else merged[idx] = { id: cat.id, name: cat.label || cat.name, color: cat.color }
        })
        return merged
      })
    }
  }

  const categories = actions.map(a => ({ id: a.id, label: a.name, color: a.color }))

  return {
    actions,
    events,
    notes,
    entries,
    categories,
    addAction,
    updateAction,
    deleteAction,
    addDayAction,
    updateDayAction,
    updateDayActionDescription: (id, desc) => updateDayAction(id, null, null, desc),
    deleteDayAction,
    addNote,
    updateNote,
    deleteNote,
    saveEntry,
    deleteEntry,
    addEvent,
    deleteEvent,
    addCategory,
    deleteCategory,
    importData,
  }
}