import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import { useState } from 'react'
import { TASK_TYPES, TASK_TYPE_LABEL, type TaskDto, type TaskType } from '@/api/types'
import { TagChip } from '@/common/TagChip/TagChip'
import { tagToneFor } from '@/common/TypeChip/TypeChip'
import { tokens } from '@/theme/tokens'

interface TypesSectionProps {
  allTasks: TaskDto[]
  selected: TaskType[]
  onToggleType: (type: TaskType) => void
}

/** Every task type in use as a pill with its task count. Pressing one filters the board to that type. */
export function TypesSection({ allTasks, selected, onToggleType }: TypesSectionProps) {
  const [open, setOpen] = useState(true)
  const counts = new Map<TaskType, number>()
  for (const task of allTasks) if (task.type) counts.set(task.type, (counts.get(task.type) ?? 0) + 1)
  const present = TASK_TYPES.filter((type) => counts.has(type))

  return (
    <Box component="section" aria-labelledby="types-heading">
      <ButtonBase
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="types-list"
        sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: `${tokens.radius.control}px`, py: 0.5, '&:hover': { bgcolor: tokens.color.wash } }}
      >
        <Box component="h2" id="types-heading" sx={{ m: 0, fontSize: '0.8125rem', fontWeight: 500 }}>
          Types
        </Box>
        <ExpandMoreRounded aria-hidden sx={{ fontSize: 16, color: tokens.color.faint, transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 150ms ease-out' }} />
      </ButtonBase>
      {open && (
        <Box id="types-list" sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {present.length === 0 && <Box sx={{ fontSize: '0.75rem', color: tokens.color.faint }}>No task has a type yet.</Box>}
          {present.map((type) => {
            const pressed = selected.includes(type)
            return (
              <ButtonBase
                key={type}
                onClick={() => onToggleType(type)}
                aria-pressed={pressed}
                aria-label={`${TASK_TYPE_LABEL[type]}, ${counts.get(type)} tasks. Filter the board to this type`}
                sx={{ gap: 0.75, borderRadius: `${tokens.radius.key}px`, outline: pressed ? `1px solid ${tokens.color.text}` : 'none', outlineOffset: 1 }}
              >
                <TagChip label={TASK_TYPE_LABEL[type]} tone={tagToneFor(type)} />
                <Box component="span" sx={{ fontFamily: tokens.font.mono, fontSize: '0.6875rem', color: tokens.color.faint, pr: 0.5 }}>
                  {counts.get(type)}
                </Box>
              </ButtonBase>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
