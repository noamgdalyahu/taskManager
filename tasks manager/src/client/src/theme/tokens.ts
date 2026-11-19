/**
 * Design tokens for the near-monochrome, hairline-bordered look. Components read them as `tokens.color.x`, which is not a
 * hex but `var(--sm-x)`, so one style works in both themes: `theme.ts` declares the variables, and the `data-theme`
 * attribute on <html> picks which set is live.
 *
 * Colour appears in only a few places: state dots, tags, avatars and the sprint progress bar. Tags and avatars are tinted
 * from one base hue (see `HUES`): background is the hue at 18% alpha, text is the hue mixed 45% into the theme's text
 * colour, so contrast holds in both themes.
 */

/** Base hues for tags and avatars. The same in both themes; the tint formula adapts them. */
const HUES = {
  blue: '#4f8cff',
  teal: '#2ec4b6',
  orange: '#f0903a',
  purple: '#9b7bff',
  green: '#3fb97a',
  pink: '#ec6ea8',
  red: '#ef5b5b',
  amber: '#f0a020',
  gray: '#8a8a95',
} as const

const tintBg = (hue: string) => `color-mix(in srgb, ${hue} 18%, transparent)`
const tintFg = (hue: string) => `color-mix(in srgb, ${hue} 45%, var(--sm-text))`

/** tone1..tone9 in the order of HUES. */
const tones = Object.fromEntries(
  Object.values(HUES).flatMap((hue, index) => [
    [`tone${index + 1}Bg`, tintBg(hue)],
    [`tone${index + 1}Fg`, tintFg(hue)],
  ]),
) as Record<`tone${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}${'Bg' | 'Fg'}`, string>

const light = {
  primary: '#4f56d8',
  primaryHover: '#3f45b8',
  primarySoft: '#efeff2',
  canvas: '#ffffff',
  surface: '#ffffff',
  surfaceSunken: '#f6f6f7',
  cell: '#f6f6f7',
  card: '#ffffff',
  cardHover: '#fafafa',
  dropHover: '#efeff2',
  border: '#e6e6e9',
  borderStrong: '#d6d6db',
  borderHover: '#b3b3bc',
  text: '#0a0a0b',
  muted: '#4b4b54',
  faint: '#6a6a74',
  wash: '#efeff2',
  track: '#e3e3e8',
  kbd: '#f1f1f4',
  focus: '#4f56d8',
  btn: '#0a0a0b',
  btnText: '#ffffff',
  stTodo: '#8a8a95',
  stProgress: '#4f56d8',
  stQa: '#d9822b',
  stDone: '#2f9e66',
  ink: '#0a0a0b',
  onInk: '#ffffff',
  neutralBg: '#efeff2',
  neutralText: '#4b4b54',
  warnBg: tintBg(HUES.amber),
  warnText: tintFg(HUES.amber),
  forecast: '#d9822b',
  tealBg: tintBg(HUES.teal),
  tealText: tintFg(HUES.teal),
  success: '#2f9e66',
  danger: '#c0392b',
  dangerSoft: 'rgba(239, 91, 91, 0.14)',
  idealLine: '#8a8a95',
  hover: '#efeff2',
  shadow: '0 1px 2px rgba(10, 10, 20, 0.08)',
  // Kept for the older screens: sidebar, lane header and accent names now point at the same few colours.
  sidebar: '#ffffff',
  laneHeader: '#f6f6f7',
  accent: '#0a0a0b',
  accentLine: '#4f56d8',
  navActive: '#efeff2',
  ...tones,
}

type PaletteKey = keyof typeof light

const dark: Record<PaletteKey, string> = {
  primary: '#9a9cff',
  primaryHover: '#b3b5ff',
  primarySoft: '#171717',
  canvas: '#000000',
  surface: '#080808',
  surfaceSunken: '#0e0e0e',
  cell: '#0e0e0e',
  card: '#141414',
  cardHover: '#191919',
  dropHover: '#171717',
  border: '#1f1f1f',
  borderStrong: '#2a2a2a',
  borderHover: '#3d3d3d',
  text: '#f5f5f5',
  muted: '#b3b3bb',
  faint: '#8e8e98',
  wash: '#171717',
  track: '#262626',
  kbd: '#161616',
  focus: '#9a9cff',
  btn: '#f5f5f5',
  btnText: '#000000',
  stTodo: '#7d7d88',
  stProgress: '#7c83ff',
  stQa: '#f0a35e',
  stDone: '#58c98a',
  ink: '#f5f5f5',
  onInk: '#000000',
  neutralBg: '#171717',
  neutralText: '#b3b3bb',
  warnBg: tintBg(HUES.amber),
  warnText: tintFg(HUES.amber),
  forecast: '#f0a35e',
  tealBg: tintBg(HUES.teal),
  tealText: tintFg(HUES.teal),
  success: '#58c98a',
  danger: '#ff7b70',
  dangerSoft: 'rgba(239, 91, 91, 0.16)',
  idealLine: '#8e8e98',
  hover: '#171717',
  shadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
  sidebar: '#000000',
  laneHeader: '#0e0e0e',
  accent: '#f5f5f5',
  accentLine: '#9a9cff',
  navActive: '#171717',
  ...tones,
}

export const palettes = { light, dark }

/** The CSS variable declarations for one theme, e.g. { '--sm-primary': '#4f56d8', ... }. */
export function cssVariables(mode: 'light' | 'dark'): Record<string, string> {
  return Object.fromEntries(Object.entries(palettes[mode]).map(([key, value]) => [`--sm-${key}`, value]))
}

const ref = <K extends PaletteKey>(key: K) => `var(--sm-${key})`
const colors = Object.fromEntries(Object.keys(light).map((key) => [key, ref(key as PaletteKey)])) as Record<PaletteKey, string>

export const tokens = {
  color: colors,
  /** 3px keys, chips and tags; 4px buttons, inputs, nav items and inner cells; 5px task cards; 6px panels. Nothing rounder but avatars. */
  radius: { key: 3, control: 4, task: 5, card: 6, sheet: 6, pill: 3 },
  font: {
    mono: '"JetBrains Mono Variable", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  },
  /** Deterministic avatar colours, picked from a member id so the same person is always the same colour. */
  avatar: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    bg: ref(`tone${n}Bg` as PaletteKey),
    fg: ref(`tone${n}Fg` as PaletteKey),
    /** The pure hue, for small colour squares. */
    base: Object.values(HUES)[n - 1],
  })),
  layout: { sidebarWidth: 240, sidebarCollapsedWidth: 64 },
} as const

export type AvatarTone = (typeof tokens.avatar)[number]
