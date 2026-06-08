import { useState, useEffect } from "react"

const ENTRIES_KEY    = "diary_entries"
const EVENTS_KEY     = "diary_events"
const CATEGORIES_KEY = "diary_categories"

const DEFAULT_CATEGORIES = [
  { id: 'legs', label: 'Legs', color: '#fca5a5' },
  { id: 'pull', label: 'Pull', color: '#93c5fd' },
  { id: 'push', label: 'Push', color: '#fde68a' },
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
  const [entries,    setEntries]    = useState(() => load(ENTRIES_KEY,    {}))
  const [events,     setEvents]     = useState(() => load(EVENTS_KEY,     []))
  const [categories, setCategories] = useState(() => load(CATEGORIES_KEY, DEFAULT_CATEGORIES))

  useEffect(() => {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  }, [categories])

  function saveEntry(dateKey, note, color, category) {
    setEntries(prev => ({ ...prev, [dateKey]: { note, color, category } }))
  }

  function deleteEntry(dateKey) {
    setEntries(prev => {
      const next = { ...prev }
      delete next[dateKey]
      return next
    })
  }

  function addEvent(dateKey, title, color) {
    setEvents(prev => [
      ...prev,
      { id: Date.now(), date: dateKey, title, color }
    ])
  }

  function deleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  function addCategory(label, color) {
    setCategories(prev => [
      ...prev,
      { id: Date.now().toString(), label, color }
    ])
  }

  function deleteCategory(id) {
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return {
    entries, events, categories,
    saveEntry, deleteEntry,
    addEvent, deleteEvent,
    addCategory, deleteCategory,
  }
}