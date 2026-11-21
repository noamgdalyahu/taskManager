import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { useAssignTask, useChangeStatus } from '@/api/tasks'
import { STATUS_LABEL, TASK_STATUSES, type TaskDto, type TaskStatus, type TeamMemberDto } from '@/api/types'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { StatusChip } from '@/common/StatusChip/StatusChip'
import { TypeChip } from '@/common/TypeChip/TypeChip'
import { Surface } from '@/common/Surface/Surface'
import { formatDay, formatHours } from '@/lib/format'

interface TaskSummaryProps {
  task: TaskDto
  members: TeamMemberDto[]
  allTasks: Map<string, TaskDto>
  sprintName: string | undefined
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.secondary' }}>
        {label}
      </Typography>
      {children}
    </Box>
  )
}

export function TaskSummary({ task, members, allTasks, sprintName }: TaskSummaryProps) {
  const changeStatus = useChangeStatus()
  const assign = useAssignTask()
  const error = changeStatus.error ?? assign.error

  return (
    <Surface sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error && <Alert severity="warning">{messageOf(error)}</Alert>}

      <Field label="Status">
        <TextField
          select
          size="small"
          value={task.status}
          onChange={(event) => changeStatus.mutate({ taskId: task.id, status: event.target.value as TaskStatus })}
          slotProps={{ htmlInput: { 'aria-label': 'Status' } }}
        >
          {TASK_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {STATUS_LABEL[status]}
            </MenuItem>
          ))}
        </TextField>
      </Field>

      <Field label="Assignee">
        <TextField
          select
          size="small"
          value={task.assigneeId ?? ''}
          onChange={(event) => assign.mutate({ taskId: task.id, assigneeId: event.target.value || null })}
          slotProps={{ htmlInput: { 'aria-label': 'Assignee' } }}
        >
          <MenuItem value="">Unassigned</MenuItem>
          {members.map((member) => (
            <MenuItem key={member.id} value={member.id}>
              {member.name}
            </MenuItem>
          ))}
        </TextField>
      </Field>

      <Field label="Estimate">
        <Typography>{formatHours(task.estimateHours)}</Typography>
      </Field>
      <Field label="Deadline">
        <Typography>{task.deadline ? formatDay(task.deadline) : 'None'}</Typography>
      </Field>
      <Field label="Sprint">
        <Typography>{sprintName ?? 'Not in a sprint'}</Typography>
      </Field>

      {task.type && (
        <Field label="Type">
          <Box>
            <TypeChip type={task.type} />
          </Box>
        </Field>
      )}

      {task.dependsOn.length > 0 && (
        <Field label="Depends on">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {task.dependsOn.map((id) => {
              const dependency = allTasks.get(id)
              return (
                <Box key={id} sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                  <Typography variant="body2">{dependency?.title ?? 'Another task'}</Typography>
                  {dependency && <StatusChip status={dependency.status} />}
                </Box>
              )
            })}
          </Box>
        </Field>
      )}
    </Surface>
  )
}
