import { useSyncExternalStore } from 'react'

/**
 * The navigation's own memory, as in Azure DevOps: whether the sidebar is collapsed to an icon rail, and which groups the
 * person closed. It is remembered across visits (localStorage). A small external store, not component state, because the
 * shell (which sizes the column) and the sidebar (which draws it) must always agree on the same answer.
 */
interface NavState {
  collapsed: boolean
  closedGroups: string[]
}

const KEY = 'sm.nav'
const listeners = new Set<() => void>()

function load(): NavState {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<NavState>
    return { collapsed: parsed.collapsed === true, closedGroups: Array.isArray(parsed.closedGroups) ? parsed.closedGroups : [] }
  } catch {
    return { collapsed: false, closedGroups: [] }
  }
}

let state: NavState = load()

function update(next: NavState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // blocked storage: the choice simply lasts until the tab closes
  }
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useNavState() {
  const current = useSyncExternalStore(subscribe, () => state)
  return {
    collapsed: current.collapsed,
    isGroupOpen: (id: string) => !current.closedGroups.includes(id),
    /** Opens a group and leaves it open if it already is, so running it twice (React StrictMode does) changes nothing. */
    openGroup: (id: string) => {
      if (state.closedGroups.includes(id)) update({ ...state, closedGroups: state.closedGroups.filter((group) => group !== id) })
    },
    toggleCollapsed: () => update({ ...state, collapsed: !state.collapsed }),
    toggleGroup: (id: string) =>
      update({ ...state, closedGroups: state.closedGroups.includes(id) ? state.closedGroups.filter((group) => group !== id) : [...state.closedGroups, id] }),
  }
}
