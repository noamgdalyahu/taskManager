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
import type { SprintDto, TaskDto } from '@/api/types'
import { messageOf } from '@/common/ErrorState/ErrorState'

interface NewTaskDialogProps {
  projectId: string
  sprints: SprintDto[]
  tasks: TaskDto[]
  /** Skills the team already has, offered as suggestions (a new skill can still be typed). */
  skillOptions: string[]
  onClose: () => void
}

export function NewTaskDialog({ projectId, sprints, tasks, skillOptions, onClose }: NewTaskDialogProps) {
  const create = useCreateTask(projectId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [estimate, setEstimate] = useState('4')
  const [deadline, setDeadline] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [dependsOn, setDependsOn] = useState<TaskDto[]>([])
  const [sprintId, setSprintId] = useState('')

  const estimateValue = Number(estimate)
  const valid = title.trim() !== '' && estimateValue >= 0 && estimateValue <= 1000

  async function submit(event: FormEvent) {
    event.preventDefault()
    await create.mutateAsync({
      title,
      description,
      estimateHours: estimateValue,
      deadline: deadline || null,
      requiredSkills: skills,
      dependsOn: dependsOn.map((task) => task.id),
      sprintId: sprintId || null,
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
            freeSolo
            options={skillOptions}
            value={skills}
            onChange={(_event, value) => setSkills(value)}
            renderInput={(params) => <TextField {...params} label="Required skills" helperText="Press Enter to add a skill. Only members with all of them can be assigned." />}
          />
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
