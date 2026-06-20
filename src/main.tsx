import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

type SiteLinks = {
  resume: string
}

const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'

async function bootstrap() {
  if (normalizedPath === '/resume') {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}links.json`)
      if (response.ok) {
        const links = (await response.json()) as SiteLinks
        window.location.replace(links.resume)
        return
      }
    } catch {
      // Fall through to error message below.
    }

    document.body.textContent = 'Unable to redirect to resume.'
    return
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
