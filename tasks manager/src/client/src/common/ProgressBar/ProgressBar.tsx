import Box from '@mui/material/Box'
import { motion } from 'motion/react'
import { springs } from '@/theme/motion'
import { tokens } from '@/theme/tokens'

interface ProgressBarProps {
  /** 0 to 100. */
  value: number
  /** Read by screen readers, for example "Dana: 22 of 32 hours done". */
  label: string
  height?: number
  color?: string
}

/**
 * The fill is a spring, not a CSS transition: when the value changes mid-animation (a task finishes while the bar is
 * still growing) it re-targets from where it currently is instead of jumping. `initial={false}` means no animation on
 * first paint, only on change. MotionConfig at the app root turns the movement off for reduced-motion users.
 */
export function ProgressBar({ value, label, height = 8, color = tokens.color.primary }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, value))
  return (
    <Box
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      sx={{ bgcolor: tokens.color.track, borderRadius: `${tokens.radius.pill}px`, height, overflow: 'hidden' }}
    >
      <motion.div
        initial={false}
        animate={{ width: `${percent}%` }}
        transition={springs.snappy}
        style={{ height: '100%', background: color, borderRadius: tokens.radius.pill }}
      />
    </Box>
  )
}
