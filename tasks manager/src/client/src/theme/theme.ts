import { createTheme } from '@mui/material/styles'
import { cssVariables, palettes, tokens } from './tokens'

const c = tokens.color

/** Inter for text, Heebo behind it so Hebrew renders in a matching face. Numbers use `tokens.font.mono`. */
export const fontStack = ['"Inter Variable"', 'Inter', '"Heebo Variable"', 'Heebo', '"Segoe UI"', 'system-ui', 'sans-serif'].join(',')

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
    primary: { main: p.primary, dark: p.primaryHover, light: p.primarySoft, contrastText: mode === 'dark' ? '#000000' : '#FFFFFF' },
    secondary: { main: p.ink },
    error: { main: p.danger, light: p.dangerSoft },
    warning: { main: p.stQa, light: p.neutralBg },
    success: { main: p.stDone, light: p.neutralBg },
    background: { default: p.canvas, paper: p.surface },
    text: { primary: p.text, secondary: p.muted },
    divider: p.border,
  },
  shape: { borderRadius: tokens.radius.control },
  // Sizes in rem so the layout scales with the user's text-size setting (section 15).
  typography: {
    fontFamily: fontStack,
    fontSize: 13,
    // Tracking is size-specific: tighter as text grows, near zero for body, slightly open for small text.
    h1: { fontSize: '1.3125rem', fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.01em' },
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
        'html[data-theme="dark"]': { ...cssVariables('dark'), colorScheme: 'dark' },
        // Every control gets the same visible 2px focus ring.
        ':focus-visible': { outline: `2px solid ${c.focus}`, outlineOffset: 2 },
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
          minHeight: 36,
          borderRadius: tokens.radius.control,
          paddingInline: 14,
          // Feedback on press, instantly (section 1): scale on :active, no waiting for the click to finish.
          transition: 'transform 100ms ease-out, background-color 120ms ease-out, border-color 120ms ease-out, box-shadow 120ms ease-out',
          '&:active:not(.Mui-disabled)': { transform: 'scale(0.97)' },
        },
        sizeSmall: { minHeight: 30, paddingInline: 10 },
        outlined: {
          color: c.text,
          backgroundColor: 'transparent',
          borderColor: c.borderStrong,
          '&:hover': { backgroundColor: c.wash, borderColor: c.borderHover },
        },
        contained: { backgroundColor: c.btn, color: c.btnText, '&:hover': { backgroundColor: c.btn, opacity: 0.88 }, '&.Mui-disabled': { backgroundColor: c.track, color: c.faint } },
        text: { color: c.primary },
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
          minHeight: 36,
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
          border: `1px solid ${c.borderStrong}`,
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
          backgroundImage: 'none',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: tokens.radius.card,
          border: `1px solid ${c.border}`,
          backgroundColor: c.surface,
          backgroundImage: 'none',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiMenuItem: { styleOverrides: { root: { minHeight: 34, borderRadius: tokens.radius.control, marginInline: 4, fontSize: '0.8125rem' } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: tokens.radius.task, alignItems: 'center' } } },
    MuiTooltip: { styleOverrides: { tooltip: { fontSize: '0.75rem', borderRadius: tokens.radius.control, backgroundColor: c.ink, color: c.onInk } } },
    MuiTab: { styleOverrides: { root: { minHeight: 40, textTransform: 'none', fontWeight: 600 } } },
  },
  })
}

export const lightTheme = makeTheme('light')
export const darkTheme = makeTheme('dark')
