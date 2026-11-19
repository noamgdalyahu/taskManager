import '@fontsource-variable/inter'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import { configureHttp } from '@/api/http'
import { getSession, setSession } from '@/auth/session'
import { initAppearance } from '@/theme/appearance'

// Apply the saved look (Classic or Glass) before the first paint.
initAppearance()

// Wire the HTTP layer to the session before React renders anything, so the very first request already carries the token.
configureHttp({
  getToken: () => getSession()?.token ?? null,
  onUnauthorized: () => setSession(null),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
