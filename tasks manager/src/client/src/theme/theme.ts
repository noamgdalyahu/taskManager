import { createTheme } from '@mui/material/styles'
import { cssVariables, palettes, tokens } from './tokens'

const c = tokens.color

/**
 * Platform font first (apple-design, section 15): SF on Apple devices, which already ships optical sizing and tracking
 * tables. Inter is the fallback so Windows and Android match the approved mockups instead of falling to Arial.
 */
export const fontStack = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"SF Pro Text"',
  '"SF Pro Display"',
  '"Inter Variable"',
  '"Segoe UI"',
  'system-ui',
  'sans-serif',
].join(',')

/**
 * One theme per appearance. MUI needs real colour values for its palette (it derives hover and contrast colours from
 * them), so the palette reads the raw hex; everything styled by hand reads `tokens.color`, which are CSS variables that
 * follow the appearance, so those styles never need to know which look is on.
 */
function makeTheme(mode: 'light' | 'dark') {
  const p = palettes[mode]
  return createTheme({
  palette: {
    mode,
    primary: { main: p.primary, dark: p.primaryHover, light: p.primarySoft, contrastText: mode === 'dark' ? '#0E1016' : '#FFFFFF' },
    secondary: { main: p.ink },
    error: { main: p.danger, light: p.dangerSoft },
    warning: { main: p.warnText, light: p.warnBg },
    success: { main: p.tealText, light: p.tealBg },
    background: { default: p.canvas, paper: p.surface },
    text: { primary: p.text, secondary: p.muted },
    divider: p.border,
  },
  shape: { borderRadius: tokens.radius.control },
  // Sizes in rem so the layout scales with the user's text-size setting (section 15).
  typography: {
    fontFamily: fontStack,
    fontSize: 14,
    // Tracking is size-specific: tighter as text grows, near zero for body, slightly open for small text.
    h1: { fontSize: '1.625rem', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.022em' },
    h2: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.011em' },
    h3: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.35, letterSpacing: '-0.006em' },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.006em' },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.003em' },
    body1: { fontSize: '0.875rem', lineHeight: 1.5, letterSpacing: '0em' },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5, letterSpacing: '0.002em' },
    caption: { fontSize: '0.75rem', lineHeight: 1.45, letterSpacing: '0.01em' },
    overline: { fontSize: '0.6875rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '0.06em' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.003em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // The colour variables for each appearance; the attribute on <html> picks which set is live.
        ':root': cssVariables('light'),
        'html[data-appearance="dark"]': { ...cssVariables('dark'), colorScheme: 'dark' },
        body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', textRendering: 'optimizeLegibility' },
        // Reduced motion does not mean no feedback: state still changes, it just stops travelling (section 14).
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: tokens.radius.control,
          paddingInline: 16,
          // Feedback on press, instantly (section 1): scale on :active, no waiting for the click to finish.
          transition: 'transform 100ms ease-out, background-color 120ms ease-out, border-color 120ms ease-out, box-shadow 120ms ease-out',
          '&:active:not(.Mui-disabled)': { transform: 'scale(0.97)' },
        },
        sizeSmall: { minHeight: 36, paddingInline: 12 },
        outlined: {
          color: c.text,
          backgroundColor: c.surface,
          borderColor: c.borderStrong,
          '&:hover': { backgroundColor: c.canvas, borderColor: c.borderStrong },
        },
        contained: { '&:hover': { backgroundColor: c.primaryHover } },
        text: { color: c.primaryHover },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          width: 44,
          height: 44,
          transition: 'transform 100ms ease-out, background-color 120ms ease-out',
          '&:active:not(.Mui-disabled)': { transform: 'scale(0.94)' },
        },
        sizeSmall: { width: 36, height: 36 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.pill, fontWeight: 600, fontSize: '0.75rem', height: 26, letterSpacing: '0.005em' },
        label: { paddingInline: 10 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: tokens.radius.control,
          backgroundColor: c.surface,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: c.borderStrong },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: c.muted },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: c.primary, borderWidth: 2 },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { color: c.muted } } },
    MuiFormLabel: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiCheckbox: { defaultProps: { color: 'primary' }, styleOverrides: { root: { padding: 9 } } },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 8, borderRadius: tokens.radius.pill, backgroundColor: c.track },
        bar: { borderRadius: tokens.radius.pill },
      },
    },
    MuiDialog: {
      styleOverrides: {
        // Dim to focus: a modal task gets a scrim (section 12).
        root: { '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.45)' } },
        paper: {
          borderRadius: tokens.radius.sheet,
          boxShadow: '0 24px 64px rgba(16, 24, 40, 0.18), 0 2px 8px rgba(16, 24, 40, 0.08)',
          backgroundImage: 'none',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: tokens.radius.card,
          border: `1px solid ${c.border}`,
          backgroundColor: 'color-mix(in srgb, var(--sm-surface) 82%, transparent)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 12px 32px rgba(16, 24, 40, 0.14)',
          '@media (prefers-reduced-transparency: reduce)': { backgroundColor: c.surface, backdropFilter: 'none' },
        },
      },
    },
    MuiMenuItem: { styleOverrides: { root: { minHeight: 44, borderRadius: 8, marginInline: 6 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: tokens.radius.task, alignItems: 'center' } } },
    MuiTooltip: { styleOverrides: { tooltip: { fontSize: '0.75rem', borderRadius: 8, backgroundColor: c.ink, color: c.onInk } } },
    MuiTab: { styleOverrides: { root: { minHeight: 44, textTransform: 'none', fontWeight: 600 } } },
  },
  })
}

export const lightTheme = makeTheme('light')
export const darkTheme = makeTheme('dark')
