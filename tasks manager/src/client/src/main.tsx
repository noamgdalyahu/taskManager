import '@fontsource-variable/inter'
import '@fontsource-variable/heebo'
import '@fontsource-variable/jetbrains-mono'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import { configureHttp } from '@/api/http'
import { getSession, setSession } from '@/auth/session'
import { initAppearance } from '@/theme/appearance'

// Apply the saved theme (or the system one) before the first paint.
initAppearance()

// Wire the HTTP layer to the session before React renders anything, so the very first request already carries the token.
configureHttp({
  getToken: () => getSession()?.token ?? null,
  getExpiresAt: () => getSession()?.expiresAt ?? null,
  // A renewed token replaces the old one; the person stays as they were.
  onRenewed: (response) => setSession({ token: response.accessToken, expiresAt: response.expiresAt, user: response.user }),
  onUnauthorized: () => setSession(null),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
