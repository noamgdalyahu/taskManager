import { TASK_TYPE_LABEL, type TaskType } from '@/api/types'
import { TagChip } from '@/common/TagChip/TagChip'

const tone = (n: number) => ({ bg: `var(--sm-tone${n}Bg)`, fg: `var(--sm-tone${n}Fg)` })

/** One hue per type (the label always says which, so colour is never the only signal). */
const TONE: Record<TaskType, { bg: string; fg: string }> = {
  Bug: tone(7),
  UserStory: tone(1),
  Task: tone(9),
  Epic: tone(4),
  Feature: tone(5),
  Issue: tone(3),
  TestCase: tone(2),
  Ticket: tone(6),
}

/** The tint of a type, for places that draw their own pill. */
export const tagToneFor = (type: TaskType) => TONE[type]

/** The task's type as a tinted pill. Renders nothing for a task that has no type. */
export function TypeChip({ type }: { type: TaskType | null | undefined }) {
  if (!type) return null
  return <TagChip label={TASK_TYPE_LABEL[type]} tone={TONE[type]} />
}
