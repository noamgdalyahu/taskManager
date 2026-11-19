import Box from '@mui/material/Box'
import { tokens } from '@/theme/tokens'

/** A keyboard shortcut hint such as "Ctrl+K": a 3px keycap with a hairline border and mono text. */
export function Kbd({ children }: { children: string }) {
  return (
    <Box
      component="kbd"
      aria-hidden
      sx={{
        flex: '0 0 auto',
        px: '5px',
        py: '1px',
        borderRadius: `${tokens.radius.key}px`,
        border: `1px solid ${tokens.color.border}`,
        bgcolor: tokens.color.kbd,
        color: tokens.color.faint,
        fontFamily: tokens.font.mono,
        fontSize: '0.6875rem',
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Box>
  )
}
