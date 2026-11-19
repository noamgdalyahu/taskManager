import { TASK_TYPE_LABEL, type TaskType } from '@/api/types'
import { TagChip } from '@/common/TagChip/TagChip'

const tone = (n: number) => ({ bg: `var(--sm-tone${n}Bg)`, fg: `var(--sm-tone${n}Fg)` })

/** One hue per type (the label always says which, so colour is never the only signal). */
const TONE: Record<TaskType, { bg: string; fg: string }> = {
  Epic: tone(4),
  DesignTask: tone(6),
  Documentation: tone(9),
  TestingQa: tone(5),
  Performance: tone(3),
  Security: tone(7),
  Infrastructure: tone(2),
  Migration: tone(1),
  Accessibility: tone(2),
  Integration: tone(1),
  Regression: tone(7),
}

/** The tint of a type, for places that draw their own pill. */
export const tagToneFor = (type: TaskType) => TONE[type]

/** The task's type as a tinted pill. Renders nothing for a task that has no type. */
export function TypeChip({ type }: { type: TaskType | null | undefined }) {
  if (!type) return null
  return <TagChip label={TASK_TYPE_LABEL[type]} tone={TONE[type]} />
}
