import { useSyncExternalStore } from 'react'

/** "light" is the white look; "dark" is the dark one. */
export type Appearance = 'light' | 'dark'

const KEY = 'sm.appearance'
const listeners = new Set<() => void>()

function read(): Appearance {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    // private mode or blocked storage: the choice simply lasts until the tab closes
    return 'light'
  }
}

let current: Appearance = read()

/** The colour variables and the browser's own widgets (scrollbars, form controls) follow one attribute on <html>. */
function apply() {
  document.documentElement.dataset.appearance = current
}

/** Call once before the first render, so a returning user never sees the other look flash by. */
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
