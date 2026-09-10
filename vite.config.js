import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Tell Vite's bundler to ignore these dev-only packages 
      // during the production build on GitHub Actions.
      external: ['eruda', 'axe-core']
    }
  }
})