// src/components/DevInspector.jsx
import { useState, useEffect, useRef, useCallback } from 'react'

const IMPACT_COLOR = {
  critical: '#ba1a1a', // M3 Error
  serious:  '#e65100', // Deep Orange
  moderate: '#c68900', // Amber
  minor:    '#65a30d', // Lime
}

// Alpha-aware color parser: converts rgb/rgba to hex and detects transparency
function parseCssColor(colorStr) {
  if (!colorStr || colorStr === 'transparent') {
    return { hex: 'Transparent', isTransparent: true, raw: colorStr }
  }

  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i)
  if (!match) return { hex: colorStr, isTransparent: false, raw: colorStr }

  const r = parseInt(match[1], 10)
  const g = parseInt(match[2], 10)
  const b = parseInt(match[3], 10)
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1

  if (a === 0) {
    return { hex: 'Transparent', isTransparent: true, raw: colorStr }
  }

  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase()
  return { hex, isTransparent: false, raw: colorStr }
}

// Walks up DOM tree to find visible background if element is transparent
function getEffectiveBackgroundColor(el) {
  let current = el
  while (current && current !== document.documentElement) {
    const bg = window.getComputedStyle(current).backgroundColor
    const parsed = parseCssColor(bg)
    if (!parsed.isTransparent) {
      return parsed.hex
    }
    current = current.parentElement
  }
  return '#FFFFFF'
}

// Static pure helper: extracts React Fiber component name, hierarchy, and source file
function getFiberData(el) {
  const fiberKey = Object.keys(el).find(
    (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
  )

  let componentName = `<${el.tagName.toLowerCase()}>`
  const componentChain = []
  let sourceFile = null

  if (fiberKey) {
    let fiber = el[fiberKey]
    while (fiber) {
      if (fiber.type && typeof fiber.type === 'function') {
        const name = fiber.type.displayName || fiber.type.name
        if (name && !componentChain.includes(name)) {
          componentChain.push(name)
          if (!sourceFile && fiber._debugSource) {
            const fileName = fiber._debugSource.fileName.split('/').pop()
            sourceFile = `${fileName}:${fiber._debugSource.lineNumber}`
          }
        }
      }
      fiber = fiber.return
    }
    if (componentChain.length > 0) {
      componentName = `<${componentChain[0]} />`
    }
  }

  return { componentName, componentChain, sourceFile }
}

export default function DevInspector() {
  const [toolsReady, setToolsReady] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const [inspectActive, setInspectActive] = useState(false)
  const [axeHighlightsActive, setAxeHighlightsActive] = useState(false)
  const [violationCount, setViolationCount] = useState(null)
  const [isErudaOpen, setIsErudaOpen] = useState(false)

  // Floating coordinates with localStorage persistence
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem('dev_inspector_pos')
      if (saved) return JSON.parse(saved)
    } catch {
      // Fallback
    }
    return {
      x: typeof window !== 'undefined' ? window.innerWidth - 64 : 300,
      y: typeof window !== 'undefined' ? window.innerHeight - 150 : 600,
    }
  })

  // Drag tracking refs
  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const initialPosRef = useRef({ x: 0, y: 0 })

  const [hoverRect, setHoverRect] = useState(null)
  const [hoverTag, setHoverTag] = useState('')
  const [selectedInfo, setSelectedInfo] = useState(null)
  const [lockedRect, setLockedRect] = useState(null)

  const erudaRef = useRef(null)
  const axeRef = useRef(null)
  const isAxeRunningRef = useRef(false)

  const clearAxeHighlights = useCallback(() => {
    document.querySelectorAll('[data-dev-axe-highlight]').forEach((el) => el.remove())
  }, [])

  // 1. Accessibility Scan
  const runAxeScan = useCallback(async () => {
    if (!axeRef.current || isAxeRunningRef.current) return

    clearAxeHighlights()
    isAxeRunningRef.current = true

    try {
      const results = await axeRef.current.run()
      setViolationCount(results.violations.length)

      if (results.violations.length === 0) {
        console.log('%c[a11y] ✓ No accessibility violations found on this view.', 'color: #16a34a; font-weight: bold;')
      } else {
        console.group(
          `%c[a11y] ${results.violations.length} accessibility violation(s) found:`,
          'color: #ba1a1a; font-weight: bold;'
        )
        results.violations.forEach((v) => {
          console.group(`[${v.impact.toUpperCase()}] ${v.id}: ${v.description}`)
          console.log('Help:', v.helpUrl)
          v.nodes.forEach((node) => {
            console.log('HTML:', node.html)
            if (node.failureSummary) console.log('Failure Reason:', node.failureSummary)

            try {
              const selector = Array.isArray(node.target) ? node.target.join(' ') : node.target
              const el = document.querySelector(selector) || document.querySelector(node.target[0])
              if (el) {
                const rect = el.getBoundingClientRect()
                const box = document.createElement('div')
                box.setAttribute('data-dev-axe-highlight', 'true')
                box.style.cssText = `
                  position: absolute;
                  top: ${rect.top + window.scrollY}px;
                  left: ${rect.left + window.scrollX}px;
                  width: ${rect.width}px;
                  height: ${rect.height}px;
                  border: 2px solid ${IMPACT_COLOR[v.impact] || '#ba1a1a'};
                  border-radius: 6px;
                  pointer-events: none;
                  z-index: 99998;
                  box-sizing: border-box;
                `
                const tag = document.createElement('div')
                tag.textContent = `[${v.impact}] ${v.id}`
                tag.style.cssText = `
                  position: absolute;
                  top: -18px;
                  left: 0;
                  background: ${IMPACT_COLOR[v.impact] || '#ba1a1a'};
                  color: white;
                  font-size: 10px;
                  font-weight: bold;
                  padding: 1px 5px;
                  border-radius: 3px;
                  white-space: nowrap;
                  font-family: monospace;
                `
                box.appendChild(tag)
                document.body.appendChild(box)
              }
            } catch {
              // Selector fallback
            }
          })
          console.groupEnd()
        })
        console.groupEnd()
      }

      setAxeHighlightsActive(true)
    } catch (err) {
      console.warn('[DevInspector] Axe scan error:', err)
    } finally {
      isAxeRunningRef.current = false
    }
  }, [clearAxeHighlights])

  const toggleFullAxeScan = useCallback(() => {
    if (axeHighlightsActive) {
      clearAxeHighlights()
      console.clear()
      setAxeHighlightsActive(false)
      setViolationCount(null)
    } else {
      console.clear()
      runAxeScan()
    }
  }, [axeHighlightsActive, clearAxeHighlights, runAxeScan])

  // 2. Auto-rescan on view/tab switch when A11y is ON
  useEffect(() => {
    if (!axeHighlightsActive) return

    let debounceTimer = null

    const observer = new MutationObserver((mutations) => {
      const isInternal = mutations.every((m) => {
        const target = m.target
        return (
          target.closest?.('#dev-unified-root') ||
          target.closest?.('[data-dev-axe-highlight]') ||
          target.id === 'dev-unified-root'
        )
      })

      if (isInternal) return

      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        console.clear()
        runAxeScan()
      }, 350)
    })

    const root = document.getElementById('root') || document.body
    observer.observe(root, { childList: true, subtree: true })

    return () => {
      clearTimeout(debounceTimer)
      observer.disconnect()
    }
  }, [axeHighlightsActive, runAxeScan])

  // 3. Initialize Eruda + Axe
  useEffect(() => {
    if (!import.meta.env.DEV) return

    const originalTouch = window.ontouchstart
    delete window.ontouchstart

    const originalMaxTouchPoints = navigator.maxTouchPoints
    if (navigator.maxTouchPoints > 0) {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      })
    }

    Promise.all([import('eruda'), import('axe-core')])
      .then(([erudaModule, axeModule]) => {
        const eruda = erudaModule.default
        const axe = axeModule.default

        eruda.init()

        const entryBtn = eruda.get('entryBtn')
        if (entryBtn && typeof entryBtn.hide === 'function') {
          entryBtn.hide()
        }

        if (eruda.util && typeof eruda.util.evalCss === 'function') {
          eruda.util.evalCss('.eruda-entry-btn { display: none !important; }')
        }

        const origShow = eruda.show.bind(eruda)
        const origHide = eruda.hide.bind(eruda)

        eruda.show = function (...args) {
          setIsErudaOpen(true)
          return origShow(...args)
        }

        eruda.hide = function (...args) {
          setIsErudaOpen(false)
          return origHide(...args)
        }

        window.ontouchstart = originalTouch !== undefined ? originalTouch : null
        if (originalMaxTouchPoints > 0) {
          delete navigator.maxTouchPoints
        }

        erudaRef.current = eruda
        axeRef.current = axe
        setToolsReady(true)
      })
      .catch((err) => {
        console.error('[DevInspector] Failed to initialize dev modules:', err)
      })

    window.runAxe = () => {
      console.clear()
      runAxeScan()
    }
    window.clearAxe = () => {
      clearAxeHighlights()
      console.clear()
      setAxeHighlightsActive(false)
    }

    return () => {
      clearAxeHighlights()
    }
  }, [clearAxeHighlights, runAxeScan])

  // 4. Element Selection
  const selectElementForHUD = useCallback(async (el) => {
    if (!el || el.closest('#dev-unified-root')) return

    const rect = el.getBoundingClientRect()
    setLockedRect({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    })

    const { componentName, componentChain, sourceFile } = getFiberData(el)
    const computed = window.getComputedStyle(el)

    const classAttr = el.getAttribute('class') || (typeof el.className === 'string' ? el.className : el.className?.baseVal) || 'None'
    const inlineStyle = el.getAttribute('style') || ''

    const parsedBg = parseCssColor(computed.backgroundColor)
    const effectiveBg = getEffectiveBackgroundColor(el)
    const parsedText = parseCssColor(computed.color)

    let a11yIssues = []
    if (axeRef.current && !isAxeRunningRef.current) {
      isAxeRunningRef.current = true
      try {
        const axeResult = await axeRef.current.run(el)
        a11yIssues = axeResult.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          helpUrl: v.helpUrl,
        }))
      } catch {
        // Fallback
      } finally {
        isAxeRunningRef.current = false
      }
    }

    setSelectedInfo({
      componentName,
      componentChain: componentChain.slice(0, 4).join(' ➔ ') || 'Native HTML',
      sourceFile: sourceFile || 'Source location unavailable',
      classes: classAttr,
      inlineStyle,
      a11yIssues,
      computed: {
        dimensions: `${Math.round(rect.width)} × ${Math.round(rect.height)} px`,
        parsedBg,
        effectiveBg,
        parsedText,
        padding: computed.padding,
        fontSize: computed.fontSize,
        borderRadius: computed.borderRadius,
      },
    })
  }, [])

  // 5. Mouse Hover (PointerMove) & Click Listeners
  useEffect(() => {
    if (!inspectActive) {
      setSelectedInfo(null)
      setLockedRect(null)
      setHoverRect(null)
      return
    }

    const handlePointerMove = (e) => {
      const target = document.elementFromPoint(e.clientX, e.clientY)
      if (!target || target.closest('#dev-unified-root') || target.hasAttribute('data-dev-axe-highlight')) {
        setHoverRect(null)
        return
      }

      const rect = target.getBoundingClientRect()
      const { componentName } = getFiberData(target)

      setHoverRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      })
      setHoverTag(`${componentName} (${Math.round(rect.width)}×${Math.round(rect.height)})`)
    }

    const handlePointerDown = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const target = document.elementFromPoint(clientX, clientY)

      if (target && !target.closest('#dev-unified-root')) {
        e.preventDefault()
        e.stopPropagation()
        selectElementForHUD(target)
      }
    }

    window.addEventListener('pointermove', handlePointerMove, true)
    window.addEventListener('click', handlePointerDown, true)
    window.addEventListener('touchstart', handlePointerDown, { capture: true, passive: false })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove, true)
      window.removeEventListener('click', handlePointerDown, true)
      window.removeEventListener('touchstart', handlePointerDown, true)
    }
  }, [inspectActive, selectElementForHUD])

  // --- 6. Draggable Floating FAB Physics ---
  const handleDragStart = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    isDraggingRef.current = true
    hasDraggedRef.current = false
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    initialPosRef.current = { ...pos }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleDragMove = (e) => {
    if (!isDraggingRef.current) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y

    if (!hasDraggedRef.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      hasDraggedRef.current = true
    }

    if (hasDraggedRef.current) {
      setPos({
        x: initialPosRef.current.x + dx,
        y: initialPosRef.current.y + dy,
      })
    }
  }

  const handleDragEnd = (e) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignored
    }

    if (hasDraggedRef.current) {
      try {
        localStorage.setItem('dev_inspector_pos', JSON.stringify(pos))
      } catch {
        // Ignored
      }
    }
  }

  if (!import.meta.env.DEV) return null

  // Clamp position to visible viewport boundaries
  const toolbarWidth = collapsed ? 48 : 310
  const toolbarHeight = collapsed ? 48 : 52
  const maxX = typeof window !== 'undefined' ? Math.max(10, window.innerWidth - toolbarWidth - 10) : 300
  const maxY = typeof window !== 'undefined' ? Math.max(10, window.innerHeight - toolbarHeight - 10) : 600
  const clampedX = Math.max(10, Math.min(maxX, pos.x))
  const clampedY = Math.max(10, Math.min(maxY, pos.y))

  return (
    <aside id="dev-unified-root" aria-label="Developer Tools" className="pointer-events-auto select-none font-sans">
      {/* 1. Real-time Mouse Hover Box & Tag Badge */}
      {inspectActive && hoverRect && !selectedInfo && (
        <div
          aria-hidden="true"
          className="fixed pointer-events-none z-[99997] border-2 border-dashed border-[#4F46E5] bg-[#4F46E5]/15 transition-all duration-75"
          style={{
            top: `${hoverRect.top - window.scrollY}px`,
            left: `${hoverRect.left - window.scrollX}px`,
            width: `${hoverRect.width}px`,
            height: `${hoverRect.height}px`,
          }}
        >
          <span className="absolute -top-6 left-0 bg-[#4F46E5] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
            {hoverTag}
          </span>
        </div>
      )}

      {/* 2. Locked Selected Element Highlight Box */}
      {inspectActive && lockedRect && (
        <div
          aria-hidden="true"
          className="fixed pointer-events-none z-[99998] border-2 border-solid border-[#4F46E5] bg-[#4F46E5]/20 shadow-md"
          style={{
            top: `${lockedRect.top - window.scrollY}px`,
            left: `${lockedRect.left - window.scrollX}px`,
            width: `${lockedRect.width}px`,
            height: `${lockedRect.height}px`,
          }}
        />
      )}

      {/* 3. Floating Exit Console Button */}
      {isErudaOpen && (
        <button
          type="button"
          onClick={() => erudaRef.current && erudaRef.current.hide()}
          aria-label="Exit Eruda Console"
          className="fixed top-3 right-3 z-[2147483647] flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#BA1A1A] text-white font-bold text-xs shadow-2xl active:scale-95 border-2 border-white transition-all"
        >
          <span>✕</span>
          <span>Exit Console</span>
        </button>
      )}

      {/* 4. Draggable Floating Toolbar (Moveable anywhere) */}
      <div
        className="fixed z-[99999] touch-none"
        style={{
          left: `${clampedX}px`,
          top: `${clampedY}px`,
        }}
      >
        {collapsed ? (
          // Draggable Collapsed M3 FAB Button
          <button
            type="button"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onClick={(e) => {
              if (hasDraggedRef.current) {
                e.preventDefault()
                e.stopPropagation()
                return
              }
              setCollapsed(false)
            }}
            aria-label="Open Developer Toolbar (Drag to reposition)"
            className="relative flex h-12 w-12 cursor-grab active:cursor-grabbing items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#1E1B4B] shadow-2xl border border-black/10 active:scale-95 transition-transform"
          >
            <span aria-hidden="true" className="text-lg">🛠️</span>
            {violationCount !== null && violationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#BA1A1A] px-1 text-[10px] font-bold text-white shadow-xs">
                {violationCount}
              </span>
            )}
          </button>
        ) : (
          // Expanded Action Bar with Drag Grip
          <div className="flex items-center gap-1.5 rounded-2xl bg-[#EEF2FF] p-1.5 shadow-2xl border border-black/10 text-xs">
            {/* Drag Handle Grip */}
            <div
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              aria-label="Drag toolbar"
              className="cursor-grab active:cursor-grabbing px-1.5 py-2 text-[#767680] text-sm select-none"
            >
              ⠿
            </div>

            {/* Inspect Button */}
            <button
              type="button"
              onClick={() => {
                setInspectActive(!inspectActive)
                if (inspectActive) {
                  setSelectedInfo(null)
                  setLockedRect(null)
                  setHoverRect(null)
                }
              }}
              className={`flex h-10 min-w-[48px] items-center gap-1 px-3 rounded-xl font-bold transition-all ${
                inspectActive
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'bg-white text-[#1E1B4B] hover:bg-black/5'
              }`}
            >
              <span aria-hidden="true">🔍</span>
              <span>Inspect</span>
            </button>

            {/* Axe A11y Button */}
            <button
              type="button"
              onClick={toggleFullAxeScan}
              className={`flex h-10 min-w-[48px] items-center gap-1 px-3 rounded-xl font-bold transition-all ${
                axeHighlightsActive
                  ? 'bg-[#BA1A1A] text-white shadow-xs'
                  : 'bg-white text-[#1E1B4B] hover:bg-black/5'
              }`}
            >
              <span aria-hidden="true">♿</span>
              <span>A11y {violationCount !== null ? `(${violationCount})` : ''}</span>
            </button>

            {/* Eruda Console Button */}
            <button
              type="button"
              disabled={!toolsReady}
              onClick={() => {
                if (!erudaRef.current) return
                if (isErudaOpen) erudaRef.current.hide()
                else erudaRef.current.show()
              }}
              className={`flex h-10 min-w-[48px] items-center gap-1 px-3 rounded-xl font-bold transition-all disabled:opacity-50 ${
                isErudaOpen ? 'bg-[#BA1A1A] text-white' : 'bg-white text-[#1E1B4B] hover:bg-black/5'
              }`}
            >
              <span aria-hidden="true">📟</span>
              <span>{isErudaOpen ? 'Close' : 'Console'}</span>
            </button>

            {/* Collapse Button */}
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse Developer Toolbar"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#45464F] hover:bg-black/5 font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 5. Inspection HUD Card */}
      {inspectActive && selectedInfo && (
        <div
          role="region"
          aria-label="Component Inspection Details"
          className="fixed top-3 left-3 right-3 z-[99999] max-h-[55vh] overflow-y-auto rounded-3xl bg-[#FAF8FF] p-4 text-[#1E1B4B] text-xs shadow-2xl border border-black/10 flex flex-col gap-3 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-black/10">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#4F46E5] tracking-wider block">
                React Component
              </span>
              <p className="text-sm font-mono font-bold text-[#1E1B4B]">
                {selectedInfo.componentName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-[#C7D2FE] px-2.5 py-1 font-mono text-[10px] font-bold text-[#1E1B4B]">
                {selectedInfo.sourceFile}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedInfo(null)
                  setLockedRect(null)
                }}
                aria-label="Close Inspector HUD"
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="space-y-2.5 font-mono">
            {/* Component Tree */}
            <div>
              <span className="text-[10px] text-[#45464F] block font-sans font-bold uppercase tracking-wider">
                Hierarchy:
              </span>
              <p className="text-[11px] text-[#45464F] truncate font-semibold mt-0.5">
                {selectedInfo.componentChain}
              </p>
            </div>

            {/* Tailwind Classes */}
            <div>
              <span className="text-[10px] text-[#45464F] block font-sans font-bold uppercase tracking-wider">
                Tailwind Classes:
              </span>
              <p className="rounded-xl bg-[#EEF2FF] p-2 text-[11px] text-[#4F46E5] break-words font-semibold mt-0.5 border border-black/5">
                {selectedInfo.classes}
              </p>
            </div>

            {/* Inline Styles */}
            {selectedInfo.inlineStyle && (
              <div>
                <span className="text-[10px] text-[#45464F] block font-sans font-bold uppercase tracking-wider">
                  Inline Styles:
                </span>
                <p className="rounded-xl bg-[#EEF2FF] p-2 text-[11px] text-[#C68900] break-words font-semibold mt-0.5 border border-black/5">
                  {selectedInfo.inlineStyle}
                </p>
              </div>
            )}

            {/* Axe Result for This Element */}
            <div>
              <span className="text-[10px] text-[#45464F] block font-sans font-bold uppercase tracking-wider">
                Accessibility (Element Scope):
              </span>
              {selectedInfo.a11yIssues.length === 0 ? (
                <p className="rounded-xl bg-[#B8F5D0] p-2 text-[11px] text-[#002110] font-bold mt-0.5 border border-black/5">
                  ✓ Passes WCAG 2.2 AA (No issues on this element)
                </p>
              ) : (
                <div className="space-y-1.5 mt-1">
                  {selectedInfo.a11yIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-[#FFDAD6] p-2 text-[#410002] text-[10px] border border-[#BA1A1A]/20"
                    >
                      <span className="font-bold uppercase tracking-wider block">
                        [{issue.impact}] {issue.id}
                      </span>
                      <span>{issue.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Computed Colors */}
            <div>
              <span className="text-[10px] text-[#45464F] block font-sans font-bold uppercase tracking-wider">
                Computed Styles:
              </span>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#EEF2FF] p-2.5 text-[10px] text-[#45464F] border border-black/5 mt-0.5">
                <div>Dimensions: <span className="text-[#1E1B4B] font-bold">{selectedInfo.computed.dimensions}</span></div>
                <div>Border Radius: <span className="text-[#1E1B4B] font-bold">{selectedInfo.computed.borderRadius}</span></div>
                <div>Padding: <span className="text-[#1E1B4B] font-bold">{selectedInfo.computed.padding}</span></div>
                <div>Font Size: <span className="text-[#1E1B4B] font-bold">{selectedInfo.computed.fontSize}</span></div>

                {/* Background Color Display */}
                <div className="col-span-2 flex items-center gap-1.5 pt-1 border-t border-black/5">
                  <span>Background:</span>
                  {selectedInfo.computed.parsedBg.isTransparent ? (
                    <>
                      <span className="italic text-[#767680]">Transparent</span>
                      <span className="text-[#45464F]">(renders</span>
                      <span
                        className="w-3 h-3 rounded-full border border-black/20 flex-shrink-0"
                        style={{ backgroundColor: selectedInfo.computed.effectiveBg }}
                      />
                      <strong className="text-[#1E1B4B] font-bold">{selectedInfo.computed.effectiveBg}</strong>
                      <span className="text-[#45464F]">)</span>
                    </>
                  ) : (
                    <>
                      <span
                        className="w-3 h-3 rounded-full border border-black/20 flex-shrink-0"
                        style={{ backgroundColor: selectedInfo.computed.parsedBg.hex }}
                      />
                      <strong className="text-[#1E1B4B] font-bold">{selectedInfo.computed.parsedBg.hex}</strong>
                    </>
                  )}
                </div>

                {/* Text Color Display */}
                <div className="col-span-2 flex items-center gap-1.5">
                  <span>Text Color:</span>
                  <span
                    className="w-3 h-3 rounded-full border border-black/20 flex-shrink-0"
                    style={{ backgroundColor: selectedInfo.computed.parsedText.hex }}
                  />
                  <strong className="text-[#1E1B4B] font-bold">{selectedInfo.computed.parsedText.hex}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}