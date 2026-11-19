import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import { useJoinProject } from '@/api/projects'
import { messageOf } from '@/common/ErrorState/ErrorState'

export function JoinProjectDialog({ open, onClose, onJoined }: { open: boolean; onClose: () => void; onJoined: (projectId: string) => void }) {
  const join = useJoinProject()
  const [code, setCode] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const project = await join.mutateAsync(code)
    setCode('')
    onJoined(project.id)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>Join a project</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {join.error && <Alert severity="error">{messageOf(join.error)}</Alert>}
          <TextField
            label="Invitation code"
            helperText="Your manager can create one on the Team page."
            autoFocus
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            slotProps={{ htmlInput: { maxLength: 32, style: { letterSpacing: '0.12em', fontWeight: 600 } } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={code.trim().length < 4 || join.isPending}>
          Join project
        </Button>
      </DialogActions>
    </Dialog>
  )
}
