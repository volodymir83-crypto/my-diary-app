import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


// 1. Import the devtools initializer
import { initDevTools } from './devtools.js'

// 2. Call it before rendering the app
initDevTools()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
