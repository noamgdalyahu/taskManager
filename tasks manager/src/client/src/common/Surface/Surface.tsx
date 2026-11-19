import Box, { type BoxProps } from '@mui/material/Box'
import { tokens } from '@/theme/tokens'

interface SurfaceProps extends BoxProps {
  /** Padding in theme spacing units. 2.5 = 20 px, the mockups' card padding. */
  padding?: number
}

/** The white card used everywhere: hairline border, 12 px radius, no shadow (depth comes from materials, not drop shadows). */
export function Surface({ padding = 2.5, sx, ...rest }: SurfaceProps) {
  return (
    <Box
      {...rest}
      sx={[
        {
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: `${tokens.radius.card}px`,
          p: padding,
          boxSizing: 'border-box',
          minWidth: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  )
}
