import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { captureLandingSource } from './lib/trafficSource.js'

// Remember where this visit came from (referring host, landing page, utm tags)
// so an RFQ sent later in the session can be attributed to search or not.
captureLandingSource()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
