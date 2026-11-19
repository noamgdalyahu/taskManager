/**
 * Design tokens. The palette comes from the approved mockups; the rest (radii, materials) follows the apple-design
 * skill. Components read these through the MUI theme or as `tokens.color.x`, never as loose hex values.
 *
 * Colours exist twice, as light and dark values (`palettes`). `tokens.color.x` is not a hex but `var(--sm-x)`, so one
 * style works in both looks: the stylesheet in `theme.ts` defines the variables for the current appearance.
 */
const light = {
  primary: '#3B4FD9',
  primaryHover: '#2A3AB0',
  primarySoft: '#E4E9FF',
  canvas: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceSunken: '#ECEEF3',
  dropHover: '#E3E7F6',
  border: '#E3E6EC',
  borderStrong: '#C9CFDA',
  text: '#1B2130',
  muted: '#5B6475',
  track: '#EEF0F4',
  ink: '#1B2130',
  onInk: '#FFFFFF',
  neutralBg: '#EEF0F4',
  neutralText: '#3B4252',
  warnBg: '#FFE9D6',
  warnText: '#8A3B00',
  forecast: '#B85A00',
  tealBg: '#D9F1EF',
  tealText: '#0B5F59',
  success: '#1E7B34',
  danger: '#B42318',
  dangerSoft: '#FEE4E2',
  idealLine: '#8892A6',
  hover: 'rgba(0, 0, 0, 0.04)',
  // Six tones for tags and avatars: a soft background and a strong foreground each.
  tone1Bg: '#E4E9FF',
  tone1Fg: '#2A3AB0',
  tone2Bg: '#D9F1EF',
  tone2Fg: '#0B5F59',
  tone3Bg: '#FFE9D6',
  tone3Fg: '#8A3B00',
  tone4Bg: '#F3E4FA',
  tone4Fg: '#6B2C91',
  tone5Bg: '#E5F3D9',
  tone5Fg: '#2F6B12',
  tone6Bg: '#FDE7EF',
  tone6Fg: '#9B1C4B',
}

type PaletteKey = keyof typeof light

const dark: Record<PaletteKey, string> = {
  primary: '#8392FF',
  primaryHover: '#A3AEFF',
  primarySoft: '#252B55',
  canvas: '#0E1016',
  surface: '#171A22',
  surfaceSunken: '#12141B',
  dropHover: '#1E2442',
  border: '#2A2F3C',
  borderStrong: '#3C4354',
  text: '#E8EAF0',
  muted: '#9AA3B5',
  track: '#262B38',
  ink: '#E8EAF0',
  onInk: '#12141B',
  neutralBg: '#262B38',
  neutralText: '#C5CBD8',
  warnBg: '#3B2513',
  warnText: '#FFB27A',
  forecast: '#F0913A',
  tealBg: '#123430',
  tealText: '#74D9CE',
  success: '#52C873',
  danger: '#FF7B70',
  dangerSoft: '#3B1B19',
  idealLine: '#7E889B',
  hover: 'rgba(255, 255, 255, 0.06)',
  tone1Bg: '#252B55',
  tone1Fg: '#AAB6FF',
  tone2Bg: '#123430',
  tone2Fg: '#74D9CE',
  tone3Bg: '#3B2513',
  tone3Fg: '#FFB27A',
  tone4Bg: '#2F2040',
  tone4Fg: '#DDA9F7',
  tone5Bg: '#1F3319',
  tone5Fg: '#A0DD7E',
  tone6Bg: '#3E1B29',
  tone6Fg: '#F6A3C0',
}

export const palettes = { light, dark }

/** The CSS variable declarations for one appearance, e.g. { '--sm-primary': '#3B4FD9', ... }. */
export function cssVariables(mode: 'light' | 'dark'): Record<string, string> {
  return Object.fromEntries(Object.entries(palettes[mode]).map(([key, value]) => [`--sm-${key}`, value]))
}

const ref = <K extends PaletteKey>(key: K) => `var(--sm-${key})`
const colors = Object.fromEntries(Object.keys(light).map((key) => [key, ref(key as PaletteKey)])) as Record<PaletteKey, string>

export const tokens = {
  color: colors,
  radius: { control: 8, task: 10, card: 12, sheet: 16, pill: 999 },
  /** Deterministic avatar colours, picked from a member id so the same person is always the same colour. */
  avatar: [1, 2, 3, 4, 5, 6].map((n) => ({
    bg: ref(`tone${n}Bg` as PaletteKey),
    fg: ref(`tone${n}Fg` as PaletteKey),
  })),
  layout: { sidebarWidth: 232, sidebarCollapsedWidth: 64 },
} as const

export type AvatarTone = (typeof tokens.avatar)[number]
