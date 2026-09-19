// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luminous Glow & Neon Indigo Canvas Scheme
        'm3-canvas': '#6366F1',             // Vivid Neon Indigo main background
        'm3-surface-glow': '#EEF2FF',       // Luminous Frost (Day cells, bars, Today FAB)
        'm3-active-pill': '#C7D2FE',        // Clear Lavender for M3 active nav indicator
        'm3-text-midnight': '#1E1B4B',      // Deep Midnight high-contrast text (AAA)
        'm3-text-secondary': '#4338CA',     // Electric Indigo for inactive nav items

        // Core Brand Roles
        'm3-primary': '#4355B9',
        'm3-on-primary': '#FFFFFF',
        'm3-primary-container': '#DEE0FF',
        'm3-on-primary-container': '#001159',

        // Tonal Surface Elevation Hierarchy
        'm3-surface': '#6366F1',
        'm3-surface-container-lowest': '#FFFFFF',
        'm3-surface-container-low': '#F4F2FA',
        'm3-surface-container': '#EEEBF4',
        'm3-surface-container-high': '#E8E5EE',
        'm3-surface-container-highest': '#E2E0E8',

        // Typography & Outlines
        'm3-on-surface': '#1E1B4B',
        'm3-on-surface-variant': '#45464F',
        'm3-outline': '#767680',
        'm3-outline-variant': '#C6C5D0',

        // Error Roles
        'm3-error': '#BA1A1A',
        'm3-on-error': '#FFFFFF',
        'm3-error-container': '#FFDAD6',
        'm3-on-error-container': '#410002',
      },
    },
  },
  plugins: [],
}