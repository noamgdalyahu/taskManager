import Chip from '@mui/material/Chip'
import { STATUS_LABEL, type TaskStatus } from '@/api/types'
import { tokens } from '@/theme/tokens'

const c = tokens.color
const tones: Record<TaskStatus, { bg: string; fg: string }> = {
  ToDo: { bg: c.neutralBg, fg: c.neutralText },
  InProgress: { bg: c.primarySoft, fg: c.primaryHover },
  InQA: { bg: c.warnBg, fg: c.warnText },
  Done: { bg: c.tealBg, fg: c.tealText },
}

export function StatusChip({ status }: { status: TaskStatus }) {
  const tone = tones[status]
  return <Chip size="small" label={STATUS_LABEL[status]} sx={{ bgcolor: tone.bg, color: tone.fg }} />
}
