import Box from '@mui/material/Box'
import { tokens } from '@/theme/tokens'

// Soft background, strong text: readable together, and distinguishable by more than hue (the text says what it is).
const TONES = tokens.avatar

function toneFor(label: string) {
  let hash = 0
  for (const character of label) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return TONES[hash % TONES.length]
}

interface TagChipProps {
  label: string
  /** Fixed colours for tags that carry meaning, such as a red "Blocked". Others get a stable colour from their name. */
  tone?: { bg: string; fg: string }
}

/** A small tag, as on an Azure Boards card. The same skill is the same colour everywhere in the app. */
export function TagChip({ label, tone }: TagChipProps) {
  const colours = tone ?? toneFor(label)
  return (
    <Box
      component="span"
      sx={{ display: 'inline-block', px: 0.875, py: 0.125, borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 600, lineHeight: 1.5, bgcolor: colours.bg, color: colours.fg, whiteSpace: 'nowrap' }}
    >
      {label}
    </Box>
  )
}
