import { useState } from 'react'
import PropTypes from 'prop-types'
import { getUsedColors } from '../utils/colorUsage'

// Curated from Refactoring UI guidelines to ensure strong semantic presence without overpowering
const COLOR_PALETTE = [
  '#C52707', // Red 
  '#C65D21', // Orange
  '#A27C1A', // Yellow
  '#0A6C74', // Cyan
  '#14919B', // Teal
  '#0B69A3', // Blue
  '#2D3A8C', // Indigo/Blue Grey
  '#7C1A87', // Purple
  '#AD4BB8', // Light Purple
  '#486581', // Muted Blue
  '#572508', // Dark Brown
  '#102A43', // Darkest Blue
]

const DEFAULT_IDS = ['legs', 'pull', 'push']

export default function Categories({ categories, entries, events, onAdd, onDelete }) {
  const usedColors = getUsedColors({ categories, entries, events })
  const availableColors = COLOR_PALETTE.filter(c => !usedColors.has(c))

  const [label, setLabel] = useState('')
  const [selectedColor, setSelectedColor] = useState(null)
  const [error, setError] = useState('')

  const color = selectedColor && availableColors.includes(selectedColor)
    ? selectedColor
    : availableColors[0] ?? null

  function handleAdd() {
    // Validate on submit rather than inline or using disabled buttons
    if (!label.trim()) {
      setError('Please enter a category name.')
      return
    }
    if (!color) {
      setError('Please select a color for your category.')
      return
    }
    
    // Clear errors and submit
    setError('')
    onAdd(label.trim(), color)
    setLabel('')
    setSelectedColor(null)
  }

  function handleLabelChange(e) {
    setLabel(e.target.value)
    if (error) setError('') // Clear error when user starts correcting
  }

  return (
    <section aria-label="Manage workout categories" className="mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Workout Categories
      </h2>

      {/* Existing categories */}
      <ul className="flex flex-col gap-3 mb-8" aria-label="Category list">
        {categories.map(cat => (
          <li
            key={cat.id}
            className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full flex-shrink-0 shadow-inner"
                style={{ backgroundColor: cat.color }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-slate-900">{cat.label}</span>
              {DEFAULT_IDS.includes(cat.id) && (
                <span className="text-xs text-slate-500 font-normal">(default)</span>
              )}
            </div>
            {!DEFAULT_IDS.includes(cat.id) && (
              <button
                onClick={() => onDelete(cat.id)}
                aria-label={`Delete ${cat.label} category`}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition px-2 py-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Add new category */}
      <section aria-labelledby="add-cat-label">
        <h3
          id="add-cat-label"
          className="text-base font-semibold text-slate-900 mb-3"
        >
          Add new category
        </h3>
        {/* Outer padding (p-5) is strictly greater than inner padding (gap-4) */}
        <div className="bg-slate-50 rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
          
          {/* Error Message rendering above fields */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2" role="alert">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cat-name"
              className="text-sm font-medium text-slate-900"
            >
              Name <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="cat-name"
              type="text"
              value={label}
              onChange={handleLabelChange}
              placeholder="e.g. Cardio"
              aria-required="true"
              aria-invalid={error.includes('name')}
              className="w-full rounded-lg border border-slate-500 p-2 text-base text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-900">
              Color <span className="text-red-600" aria-hidden="true">*</span>
            </p>
            {availableColors.length > 0 ? (
              <div
                className="flex flex-wrap gap-3"
                role="radiogroup"
                aria-label="Select category color"
              >
                {availableColors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelectedColor(c)
                      if (error) setError('')
                    }}
                    aria-label={`Color ${c}`}
                    aria-checked={color === c}
                    role="radio"
                    className={`w-10 h-10 rounded-full transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 ${
                      color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-amber-800 bg-amber-100 border border-amber-200 rounded-lg px-4 py-3">
                Every preset color is currently in use. Delete an existing category to free up a color.
              </p>
            )}
          </div>

          <button
            onClick={handleAdd}
            className="w-full mt-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold rounded-lg py-2 text-base transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 shadow-sm"
          >
            Add Category
          </button>
        </div>
      </section>
    </section>
  )
}

Categories.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id:    PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
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
  onAdd:    PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}