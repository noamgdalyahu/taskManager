import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import { useCreateSprint } from '@/api/sprints'
import type { SprintDto } from '@/api/types'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { addDays, todayIso } from '@/lib/sprintDays'

interface NewSprintDialogProps {
  open: boolean
  projectId: string
  /** Suggests "Sprint N" from how many sprints exist. */
  existingCount: number
  onClose: () => void
  onCreated: (sprint: SprintDto) => void
}

export function NewSprintDialog({ open, projectId, existingCount, onClose, onCreated }: NewSprintDialogProps) {
  const create = useCreateSprint(projectId)
  const [name, setName] = useState(`Sprint ${existingCount + 1}`)
  const [start, setStart] = useState(todayIso())
  const [end, setEnd] = useState(addDays(todayIso(), 11))
  const endBeforeStart = end < start

  async function submit(event: FormEvent) {
    event.preventDefault()
    const sprint = await create.mutateAsync({ name, startDate: start, endDate: end })
    onCreated(sprint)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>New sprint</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {create.error && <Alert severity="error">{messageOf(create.error)}</Alert>}
          <TextField label="Name" autoFocus required value={name} onChange={(event) => setName(event.target.value)} />
          <TextField label="Starts" type="date" required value={start} onChange={(event) => setStart(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField
            label="Ends"
            type="date"
            required
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            error={endBeforeStart}
            helperText={endBeforeStart ? 'The sprint cannot end before it starts' : 'Weekends are not counted as working days'}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!name.trim() || endBeforeStart || create.isPending}>
          Create sprint
        </Button>
      </DialogActions>
    </Dialog>
  )
}
