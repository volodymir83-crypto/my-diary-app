import { useState } from 'react'
import PropTypes from 'prop-types'

const COLOR_PALETTE = [
  '#fca5a5', '#fb923c', '#fde68a', '#86efac',
  '#93c5fd', '#c084fc', '#f9a8d4', '#6ee7b7',
  '#a5b4fc', '#67e8f9', '#d4d4aa', '#6b7280',
]

const DEFAULT_IDS = ['legs', 'pull', 'push']

export default function Categories({ categories, onAdd, onDelete }) {
  const [label, setLabel] = useState('')
  const [color, setColor] = useState(COLOR_PALETTE[0])

  function handleAdd() {
    if (!label.trim()) return
    onAdd(label.trim(), color)
    setLabel('')
  }

  return (
    <section aria-label="Manage workout categories">
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        Workout Categories
      </h2>

      {/* Existing categories */}
      <ul className="flex flex-col gap-2 mb-6" aria-label="Category list">
        {categories.map(cat => (
          <li
            key={cat.id}
            className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-gray-800">{cat.label}</span>
              {DEFAULT_IDS.includes(cat.id) && (
                <span className="text-xs text-gray-400">(default)</span>
              )}
            </div>
            {!DEFAULT_IDS.includes(cat.id) && (
              <button
                onClick={() => onDelete(cat.id)}
                aria-label={`Delete ${cat.label} category`}
                className="text-gray-400 hover:text-red-500 transition px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Add new category */}
      <section aria-labelledby="add-cat-label">
        <h3
          id="add-cat-label"
          className="text-sm font-medium text-gray-700 mb-2"
        >
          Add new category
        </h3>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">

          <div>
            <label
              htmlFor="cat-name"
              className="block text-xs text-gray-500 mb-1"
            >
              Name
            </label>
            <input
              id="cat-name"
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Cardio"
              className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Color</p>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Category color picker"
            >
              {COLOR_PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}${color === c ? ', selected' : ''}`}
                  aria-pressed={color === c}
                  className={[
                    'w-8 h-8 rounded-full transition',
                    color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : '',
                  ].join(' ')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!label.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl py-2.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            + Add Category
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
  onAdd:    PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}