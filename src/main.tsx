import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './stores/rewardsLogStore'
import App from './App.tsx'
import { initializeTelemetry } from './services/diagnostics/initializeTelemetry.js'
import { initializeErrorCapture } from './services/diagnostics/initializeErrorCapture.js'

initializeTelemetry()
initializeErrorCapture()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
