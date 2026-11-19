import { useSyncExternalStore } from 'react'

/** "light" is the white theme; "dark" is the black one. */
export type Appearance = 'light' | 'dark'

const KEY = 'sm.appearance'
const listeners = new Set<() => void>()

/** The saved choice, otherwise what the operating system prefers. `index.html` runs the same rule before first paint. */
function read(): Appearance {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    // private mode or blocked storage: fall through to the system preference
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

let current: Appearance = read()

/** The colour variables and the browser's own widgets (scrollbars, form controls) follow one attribute on the root element. */
function apply() {
  document.documentElement.dataset.theme = current
  document.documentElement.style.colorScheme = current
}

/** Call once before the first render. */
export function initAppearance() {
  apply()
}

export function setAppearance(next: Appearance) {
  current = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // not persisted; still applied for this session
  }
  apply()
  listeners.forEach((listener) => listener())
}

export function useAppearance(): Appearance {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
}
