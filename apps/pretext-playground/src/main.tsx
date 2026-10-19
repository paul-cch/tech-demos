import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/700.css'
import '@fontsource/noto-sans-arabic/400.css'
import '@fontsource/noto-sans-arabic/700.css'
import './emoji-font.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
