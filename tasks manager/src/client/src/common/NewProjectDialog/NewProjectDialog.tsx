import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import { useCreateProject } from '@/api/projects'
import { messageOf } from '@/common/ErrorState/ErrorState'

export function NewProjectDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (projectId: string) => void }) {
  const create = useCreateProject()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const project = await create.mutateAsync({ name, description })
    setName('')
    setDescription('')
    onCreated(project.id)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>New project</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {create.error && <Alert severity="error">{messageOf(create.error)}</Alert>}
          <TextField label="Project name" autoFocus required value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Description" multiline minRows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!name.trim() || create.isPending}>
          Create project
        </Button>
      </DialogActions>
    </Dialog>
  )
}
