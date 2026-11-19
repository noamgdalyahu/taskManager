import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import { useSetWipLimits } from '@/api/projects'
import { STATUS_LABEL, TASK_STATUSES } from '@/api/types'
import { messageOf } from '@/common/ErrorState/ErrorState'

interface BoardSettingsDialogProps {
  projectId: string
  /** Current limits keyed by status name. */
  limits: Record<string, number>
  onClose: () => void
}

/** Work-in-progress limits, one per column. Empty means no limit. */
export function BoardSettingsDialog({ projectId, limits, onClose }: BoardSettingsDialogProps) {
  const save = useSetWipLimits(projectId)
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(TASK_STATUSES.map((status) => [status, limits[status] ? String(limits[status]) : ''])))

  const invalid = (text: string) => text !== '' && !(Number.isInteger(Number(text)) && Number(text) >= 1 && Number(text) <= 99)
  const hasError = Object.values(values).some(invalid)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const next = Object.fromEntries(Object.entries(values).filter(([, text]) => text !== '').map(([status, text]) => [status, Number(text)]))
    await save.mutateAsync(next)
    onClose()
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>Board settings</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Work in progress limits keep the team focused on finishing. A limit is a signal, not a lock: when a column goes over it, its count turns red, but cards can still be moved in.
        </DialogContentText>
        {save.error && <Alert severity="error" sx={{ mb: 2 }}>{messageOf(save.error)}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TASK_STATUSES.map((status) => (
            <TextField
              key={status}
              label={`${STATUS_LABEL[status]} limit`}
              type="number"
              size="small"
              value={values[status]}
              onChange={(event) => setValues((current) => ({ ...current, [status]: event.target.value }))}
              error={invalid(values[status])}
              helperText={invalid(values[status]) ? 'Whole number from 1 to 99, or empty for no limit' : ' '}
              slotProps={{ htmlInput: { min: 1, max: 99, step: 1 } }}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={hasError || save.isPending}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
