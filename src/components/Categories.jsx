// src/components/Categories.jsx
import { useState } from 'react'
import PropTypes from 'prop-types'
import { getUsedColors } from '../utils/colorUsage'
import { M3_CONTENT_PALETTE, getColorToken } from '../utils/m3Palette'

const DEFAULT_IDS = ['legs', 'pull', 'push']

export default function Categories({ categories, entries, events, onAdd, onDelete }) {
  const usedColors = getUsedColors({ categories, entries, events })
  const availableColors = M3_CONTENT_PALETTE.filter(c => !usedColors.has(c.id))

  const [label, setLabel] = useState('')
  const [selectedColorId, setSelectedColorId] = useState(null)
  const [error, setError] = useState('')

  const colorId = selectedColorId && availableColors.some(c => c.id === selectedColorId)
    ? selectedColorId
    : availableColors[0]?.id ?? null

  function handleAdd() {
    if (!label.trim()) {
      setError('Please enter a category name.')
      return
    }
    if (!colorId) {
      setError('Please select a color for your category.')
      return
    }
    
    setError('')
    onAdd(label.trim(), colorId)
    setLabel('')
    setSelectedColorId(null)
  }

  function handleLabelChange(e) {
    setLabel(e.target.value)
    if (error) setError('')
  }

  return (
    <section aria-label="Manage workout categories" className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-[#1E1B4B]">Workout Categories</h2>
        <p className="text-xs text-[#45464F] mt-0.5">
          Categories highlight calendar days and organize your training history.
        </p>
      </div>

      {/* Existing Categories List */}
      <ul className="flex flex-col gap-2.5" aria-label="Category list">
        {categories.map(cat => {
          const token = getColorToken(cat.color)
          const isDefault = DEFAULT_IDS.includes(cat.id)

          return (
            <li
              key={cat.id}
              className="flex items-center justify-between rounded-2xl px-4 py-3 shadow-xs border border-black/5"
              style={{
                backgroundColor: token ? token.container : '#EEF2FF',
                color: token ? token.onContainer : '#1E1B4B',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-white/80 shadow-xs flex-shrink-0"
                  style={{ backgroundColor: token ? token.accent : cat.color }}
                  aria-hidden="true"
                />
                <span className="text-sm font-bold tracking-tight">{cat.label}</span>
                {isDefault && (
                  <span className="text-xs font-medium opacity-70">(default)</span>
                )}
              </div>

              {!isDefault && (
                <button
                  onClick={() => onDelete(cat.id)}
                  aria-label={`Delete ${cat.label} category`}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BA1A1A]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {/* Add New Category Card */}
      <section aria-labelledby="add-cat-label">
        <h3 id="add-cat-label" className="text-sm font-bold text-[#1E1B4B] mb-2.5">
          Create New Category
        </h3>

        <div className="bg-[#FAF8FF] rounded-3xl p-5 shadow-xs border border-black/5 flex flex-col gap-4">
          {error && (
            <div
              className="bg-[#FFDAD6] border border-[#BA1A1A]/20 text-[#410002] px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2"
              role="alert"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cat-name" className="text-xs font-bold uppercase tracking-wider text-[#45464F]">
              Category Name <span className="text-[#BA1A1A]" aria-hidden="true">*</span>
            </label>
            <input
              id="cat-name"
              type="text"
              value={label}
              onChange={handleLabelChange}
              placeholder="e.g. Cardio, Chest, Recovery..."
              aria-required="true"
              aria-invalid={error.includes('name')}
              className="w-full h-12 rounded-2xl border border-[#767680]/30 bg-white px-4 text-sm font-medium text-[#1E1B4B] placeholder-[#767680] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 shadow-xs transition"
            />
          </div>

          {/* Color Selection Palette */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#45464F]">
              Color Accent <span className="text-[#BA1A1A]" aria-hidden="true">*</span>
            </p>
            {availableColors.length > 0 ? (
              <div
                className="flex flex-wrap gap-1"
                role="radiogroup"
                aria-label="Select category color"
              >
                {availableColors.map(c => {
                  const isSelected = colorId === c.id
                  return (
                    <div key={c.id} className="w-12 h-12 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedColorId(c.id)
                          if (error) setError('')
                        }}
                        aria-label={`Color ${c.label}`}
                        aria-checked={isSelected}
                        role="radio"
                        className={`w-9 h-9 rounded-full transition-all flex items-center justify-center shadow-xs ${
                          isSelected
                            ? 'ring-3 ring-offset-2 ring-[#4F46E5] scale-110'
                            : 'hover:scale-105 border border-black/10'
                        }`}
                        style={{ backgroundColor: c.accent }}
                      >
                        {isSelected && (
                          <svg className="w-4 h-4 text-white drop-shadow-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs font-medium text-[#45464F] bg-[#EEF2FF] border border-black/5 rounded-2xl p-3">
                All preset colors are currently assigned. Delete an existing category to free up its color.
              </p>
            )}
          </div>

          {/* Add Action Button */}
          <button
            onClick={handleAdd}
            className="w-full h-12 mt-1 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-98 text-white font-bold rounded-full text-sm shadow-sm transition flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4F46E5]"
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