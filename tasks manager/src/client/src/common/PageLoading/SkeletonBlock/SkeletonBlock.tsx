import Skeleton from '@mui/material/Skeleton'
import type { SxProps, Theme } from '@mui/material/styles'
import { tokens } from '@/theme/tokens'

interface SkeletonBlockProps {
  width?: number | string
  height?: number
  /** Radius in px. Text bars are 3, panels 4. */
  radius?: number
  sx?: SxProps<Theme>
}

/** One grey placeholder shape. A calm opacity pulse, which stops entirely for people who ask their system for less motion. */
export function SkeletonBlock({ width = '100%', height = 12, radius = 3, sx }: SkeletonBlockProps) {
  return <Skeleton variant="rectangular" animation="pulse" width={width} height={height} sx={[{ bgcolor: tokens.color.track, borderRadius: `${radius}px`, maxWidth: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]} />
}
