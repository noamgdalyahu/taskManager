import CloseRounded from '@mui/icons-material/CloseRounded'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import { tokens } from '@/theme/tokens'

interface FilterChipProps {
  /** The kind of filter, e.g. "person". Shown muted before the value. */
  kind: string
  value: string
  /** Absent for a chip that only reports a fixed condition (such as the sprint). */
  onRemove?: () => void
}

const chipSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  height: 24,
  px: 1,
  boxSizing: 'border-box',
  borderRadius: `${tokens.radius.key}px`,
  border: `1px solid ${tokens.color.border}`,
  bgcolor: tokens.color.cell,
  color: tokens.color.text,
  fontSize: '0.75rem',
  maxWidth: '100%',
} as const

/** An active filter: "person: Dana". Pressing it removes the filter; without `onRemove` it is a plain label. */
export function FilterChip({ kind, value, onRemove }: FilterChipProps) {
  const content = (
    <>
      <Box component="span" sx={{ color: tokens.color.faint }}>
        {kind}:
      </Box>
      <Box component="span" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </Box>
    </>
  )
  if (!onRemove) return <Box sx={chipSx}>{content}</Box>
  return (
    <ButtonBase onClick={onRemove} aria-label={`Remove filter ${kind}: ${value}`} sx={{ ...chipSx, '&:hover': { borderColor: tokens.color.borderHover, bgcolor: tokens.color.wash }, '& svg': { fontSize: 12, color: tokens.color.faint } }}>
      {content}
      <CloseRounded aria-hidden />
    </ButtonBase>
  )
}
