// Dev-only tooling: mobile console (eruda) + accessibility auditing (axe-core)
// + a lightweight React component inspector. Gated behind import.meta.env.DEV
// and loaded via dynamic import, so Vite strips this whole module out of
// production builds — none of it ships in the installed app.
export function initDevTools() {
  if (!import.meta.env.DEV) return

  // Temporarily hide touch support from eruda BEFORE it loads.
  // Eruda evaluates feature detection the moment it is imported.
  // We must mask touch support before triggering the dynamic import so it
  // binds click/mouse-compatible listeners — letting a Bluetooth mouse work.
  const originalTouch = window.ontouchstart
  delete window.ontouchstart

  // Modern devices also use maxTouchPoints for touch detection.
  // We temporarily override the read-only property using defineProperty.
  const originalMaxTouchPoints = navigator.maxTouchPoints
  if (navigator.maxTouchPoints > 0) {
    Object.defineProperty(navigator, 'maxTouchPoints', { 
      value: 0, 
      configurable: true 
    })
  }

  Promise.all([import('eruda'), import('axe-core')]).then(([erudaModule, axeModule]) => {
    const eruda = erudaModule.default
    const axe = axeModule.default

    eruda.init()

    // Restore touch support immediately after Eruda initializes
    window.ontouchstart = originalTouch !== undefined ? originalTouch : null
    if (originalMaxTouchPoints > 0) {
      delete navigator.maxTouchPoints // Deleting our custom property reveals the native one
    }

    const IMPACT_COLOR = {
      critical: '#dc2626',
      serious:  '#ea580c',
      moderate: '#ca8a04',
      minor:    '#65a30d',
    }

    function drawBox(rect, color, label) {
      const box = document.createElement('div')
      box.setAttribute('data-axe-highlight', 'true')
      box.style.cssText = `
        position: absolute;
        top: ${rect.top + window.scrollY}px;
        left: ${rect.left + window.scrollX}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px solid ${color};
        border-radius: 4px;
        pointer-events: none;
        z-index: 999999;
        box-sizing: border-box;
      `
      if (label) {
        const tag = document.createElement('div')
        tag.textContent = label
        tag.style.cssText = `
          position: absolute;
          top: -18px;
          left: 0;
          background: ${color};
          color: white;
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 2px;
          white-space: nowrap;
          font-family: monospace;
        `
        box.appendChild(tag)
      }
      document.body.appendChild(box)
    }

    function clearHighlights() {
      document.querySelectorAll('[data-axe-highlight]').forEach(el => el.remove())
    }

    async function runAxe() {
      // Clear BEFORE scanning — otherwise the previous run's own highlight
      // boxes are still in the DOM and axe flags them as new violations.
      clearHighlights()
      const results = await axe.run()
      console.clear()

      if (results.violations.length === 0) {
        console.log('[a11y] No accessibility violations found')
        return results
      }

      console.log(`[a11y] ${results.violations.length} violation(s) found — outlined on screen:`)
      results.violations.forEach(v => {
        console.log(`  [${v.impact}] ${v.id}: ${v.description}`)
        console.log(`    Help: ${v.helpUrl}`)
        v.nodes.forEach(node => {
          console.log(`    Element: ${node.html}`)
          try {
            const el = document.querySelector(node.target[0])
            if (el) drawBox(el.getBoundingClientRect(), IMPACT_COLOR[v.impact] || '#dc2626', v.id)
          } catch {
            // Selector didn't resolve — skip drawing for this node.
          }
        })
      })

      return results
    }

    let observer = null

    function stopAxe() {
      if (observer) {
        observer.disconnect()
        observer = null
      }
      clearHighlights()
      console.log('[a11y] Stopped. Reload the page to restart automatic checking, or call runAxe() to check manually.')
    }

    window.runAxe = runAxe
    window.stopAxe = stopAxe

    // Initial check after the app settles.
    setTimeout(runAxe, 1000)

    // Re-check automatically whenever the app's content changes — covers
    // switching tabs, opening/closing modals, etc. Debounced so a burst of
    // renders (like a full tab switch) only triggers one audit.
    const root = document.getElementById('root')
    if (root) {
      let debounceTimer = null
      observer = new MutationObserver(() => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(runAxe, 500)
      })
      observer.observe(root, { childList: true, subtree: true })
    }

    // --- React component inspector -----------------------------------
    // Not an official API — reads React's internal fiber tree, which is
    // attached to DOM nodes as a property starting with "__reactFiber$"
    // whenever React runs in development mode. Best-effort, but reliable
    // enough for this purpose.
    function getFiber(node) {
      const key = Object.keys(node).find(k => k.startsWith('__reactFiber$'))
      return key ? node[key] : null
    }

    function getComponentChain(fiber) {
      const names = []
      let current = fiber
      while (current) {
        const type = current.type
        if (typeof type === 'string') names.push(type)
        else if (typeof type === 'function') names.push(type.displayName || type.name || 'Anonymous')
        current = current.return
      }
      return names.reverse()
    }

    let inspecting = false
    let inspectListener = null

    function startReactInspect() {
      if (inspecting) return
      inspecting = true

      inspectListener = e => {
        e.preventDefault()
        e.stopPropagation()

        const fiber = getFiber(e.target)
        if (!fiber) {
          console.log('[react] No React fiber found on this element')
        } else {
          console.log(`[react] ${getComponentChain(fiber).join(' > ')}`)
          const cs = window.getComputedStyle(e.target)
          const rect = e.target.getBoundingClientRect()
          console.log(`[style] background: ${cs.backgroundColor}`)
          console.log(`[style] color: ${cs.color}`)
          console.log(`[style] box-shadow: ${cs.boxShadow}`)
          console.log(`[style] border-radius: ${cs.borderRadius}`)
          console.log(`[style] border: ${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`)
          console.log(`[style] padding: ${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`)
          console.log(`[style] font: ${cs.fontSize} / ${cs.fontWeight}`)
          console.log(`[style] size: ${Math.round(rect.width)} × ${Math.round(rect.height)}`)
          const box = document.createElement('div')
          box.style.cssText = `
            position: absolute;
            top: ${e.target.getBoundingClientRect().top + window.scrollY}px;
            left: ${e.target.getBoundingClientRect().left + window.scrollX}px;
            width: ${e.target.getBoundingClientRect().width}px;
            height: ${e.target.getBoundingClientRect().height}px;
            border: 2px solid #2563eb;
            border-radius: 4px;
            pointer-events: none;
            z-index: 999999;
            box-sizing: border-box;
          `
          document.body.appendChild(box)
          setTimeout(() => box.remove(), 2000)
        }

        stopReactInspect()
      }

      document.addEventListener('click', inspectListener, true)
      console.log('[react] Tap any element on screen to see its component chain. Call stopReactInspect() to cancel without tapping.')
    }

    function stopReactInspect() {
      if (!inspecting) return
      inspecting = false
      document.removeEventListener('click', inspectListener, true)
      inspectListener = null
    }

    window.startReactInspect = startReactInspect
    window.stopReactInspect = stopReactInspect

    console.log('[devtools] eruda ready. runAxe() / stopAxe() for accessibility, startReactInspect() to tap an element and see its component chain.')
  })
}