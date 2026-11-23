import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import { useCreateTask } from '@/api/tasks'
import { TASK_TYPES, TASK_TYPE_LABEL, TASK_TYPE_PURPOSE, type SprintDto, type TaskDto, type TaskType } from '@/api/types'
import { messageOf } from '@/common/ErrorState/ErrorState'

interface NewTaskDialogProps {
  projectId: string
  sprints: SprintDto[]
  tasks: TaskDto[]
  /** The sprint the task starts in. The overview leaves it empty (backlog); the sprint board passes the sprint on screen. */
  defaultSprintId?: string
  onClose: () => void
}

/** The full "New task" form, shared by the project overview and the sprint board. */
export function NewTaskDialog({ projectId, sprints, tasks, defaultSprintId = '', onClose }: NewTaskDialogProps) {
  const create = useCreateTask(projectId)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType | ''>('')
  const [description, setDescription] = useState('')
  const [estimate, setEstimate] = useState('4')
  const [deadline, setDeadline] = useState('')
  const [dependsOn, setDependsOn] = useState<TaskDto[]>([])
  const [sprintId, setSprintId] = useState(defaultSprintId)

  const estimateValue = Number(estimate)
  const valid = title.trim() !== '' && type !== '' && estimateValue >= 0 && estimateValue <= 1000

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (type === '') return
    await create.mutateAsync({
      title,
      description,
      estimateHours: estimateValue,
      deadline: deadline || null,
      requiredSkills: [],
      dependsOn: dependsOn.map((task) => task.id),
      sprintId: sprintId || null,
      type,
    })
    onClose()
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={submit}>
      <DialogTitle>New task</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {create.error && <Alert severity="error">{messageOf(create.error)}</Alert>}
          <TextField label="Title" autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} />
          <TextField
            select
            required
            label="Type"
            value={type}
            onChange={(event) => setType(event.target.value as TaskType)}
            helperText={type ? TASK_TYPE_PURPOSE[type] : 'What kind of work this is'}
          >
            {TASK_TYPES.map((option) => (
              <MenuItem key={option} value={option}>
                {TASK_TYPE_LABEL[option]}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Description" multiline minRows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Estimate (hours)"
              type="number"
              required
              fullWidth
              value={estimate}
              onChange={(event) => setEstimate(event.target.value)}
              slotProps={{ htmlInput: { min: 0, max: 1000, step: 0.5 } }}
            />
            <TextField label="Deadline" type="date" fullWidth value={deadline} onChange={(event) => setDeadline(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
          <Autocomplete
            multiple
            options={tasks.filter((task) => task.status !== 'Done')}
            getOptionLabel={(task) => task.title}
            value={dependsOn}
            onChange={(_event, value) => setDependsOn(value)}
            renderInput={(params) => <TextField {...params} label="Must finish first" helperText="Tasks that have to be done before this one can start" />}
          />
          <TextField select label="Sprint" value={sprintId} onChange={(event) => setSprintId(event.target.value)} helperText="Leave empty to keep it in the backlog">
            <MenuItem value="">Backlog (no sprint)</MenuItem>
            {sprints
              .filter((sprint) => sprint.status !== 'Closed')
              .map((sprint) => (
                <MenuItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </MenuItem>
              ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!valid || create.isPending}>
          Create task
        </Button>
      </DialogActions>
    </Dialog>
  )
}
