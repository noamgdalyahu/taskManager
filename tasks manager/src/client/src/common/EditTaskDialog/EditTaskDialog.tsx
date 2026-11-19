import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import { useUpdateTask } from '@/api/tasks'
import { TASK_TYPES, TASK_TYPE_LABEL, type SprintDto, type TaskDto, type TaskType, type TeamMemberDto } from '@/api/types'
import { messageOf } from '@/common/ErrorState/ErrorState'

interface EditTaskDialogProps {
  task: TaskDto
  sprints: SprintDto[]
  members: TeamMemberDto[]
  onClose: () => void
}

/** Edit a work item's title, description, type, estimate, sprint and assignee (managers). Status is changed on the item itself. */
export function EditTaskDialog({ task, sprints, members, onClose }: EditTaskDialogProps) {
  const update = useUpdateTask()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [type, setType] = useState<TaskType | ''>(task.type ?? '')
  const [estimate, setEstimate] = useState(String(task.estimateHours))
  const [sprintId, setSprintId] = useState(task.sprintId ?? '')
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? '')

  const hours = Number(estimate)
  const valid = title.trim() !== '' && hours >= 0 && hours <= 1000

  async function submit(event: FormEvent) {
    event.preventDefault()
    await update.mutateAsync({
      taskId: task.id,
      body: {
        title,
        description,
        estimateHours: hours,
        deadline: task.deadline,
        requiredSkills: task.requiredSkills,
        dependsOn: task.dependsOn,
        sprintId: sprintId || null,
        assigneeId: assigneeId || null,
        type: type || undefined,
      },
    })
    onClose()
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={submit}>
      <DialogTitle>Edit work item</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {update.error && <Alert severity="error">{messageOf(update.error)}</Alert>}
          <TextField label="Title" autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} />
          <TextField label="Description" multiline minRows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Type" fullWidth value={type} onChange={(event) => setType(event.target.value as TaskType | '')}>
              <MenuItem value="">No type</MenuItem>
              {TASK_TYPES.map((option) => (
                <MenuItem key={option} value={option}>
                  {TASK_TYPE_LABEL[option]}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Estimate (hours)" type="number" required fullWidth value={estimate} onChange={(event) => setEstimate(event.target.value)} slotProps={{ htmlInput: { min: 0, max: 1000, step: 0.5 } }} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Sprint" fullWidth value={sprintId} onChange={(event) => setSprintId(event.target.value)}>
              <MenuItem value="">Backlog (no sprint)</MenuItem>
              {sprints
                .filter((sprint) => sprint.status !== 'Closed' || sprint.id === task.sprintId)
                .map((sprint) => (
                  <MenuItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField select label="Assignee" fullWidth value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
              <MenuItem value="">Unassigned</MenuItem>
              {members.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!valid || update.isPending}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
