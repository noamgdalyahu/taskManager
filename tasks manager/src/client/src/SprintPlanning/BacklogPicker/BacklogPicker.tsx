import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useUpdateTask } from '@/api/tasks'
import type { SprintDto, TaskDto } from '@/api/types'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { Surface } from '@/common/Surface/Surface'
import { BacklogItem } from '@/SprintPlanning/BacklogPicker/BacklogItem/BacklogItem'

interface BacklogPickerProps {
  sprint: SprintDto
  tasks: TaskDto[]
  /** Members see what is in the sprint but cannot change it. */
  readOnly: boolean
}

/** Tick a task to put it in this sprint, untick to send it back. Each tick is saved at once, with no separate save step. */
export function BacklogPicker({ sprint, tasks, readOnly }: BacklogPickerProps) {
  const update = useUpdateTask()
  const [busyId, setBusyId] = useState<string | null>(null)

  // Candidates: not finished, and either free or already in this sprint. Tasks planned into other sprints are not offered.
  const candidates = tasks.filter((task) => task.status !== 'Done' && (task.sprintId === null || task.sprintId === sprint.id))

  async function toggle(task: TaskDto, selected: boolean) {
    setBusyId(task.id)
    try {
      await update.mutateAsync({
        taskId: task.id,
        body: {
          title: task.title,
          description: task.description,
          estimateHours: task.estimateHours,
          deadline: task.deadline,
          requiredSkills: task.requiredSkills,
          type: task.type,
          dependsOn: task.dependsOn,
          sprintId: selected ? sprint.id : null,
          assigneeId: task.assigneeId,
        },
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Surface sx={{ flex: '1 1 300px', maxWidth: { md: 380 } }}>
      <Typography variant="h2" component="h2" sx={{ mb: 0.5 }}>
        Backlog
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Tick the tasks to include in this sprint
      </Typography>
      {update.error && <ErrorState error={update.error} />}
      {candidates.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          The backlog is empty. Add tasks on the Backlog page.
        </Typography>
      )}
      {candidates.map((task) => (
        <BacklogItem key={task.id} task={task} selected={task.sprintId === sprint.id} busy={readOnly || busyId === task.id} onToggle={(selected) => toggle(task, selected)} />
      ))}
    </Surface>
  )
}
