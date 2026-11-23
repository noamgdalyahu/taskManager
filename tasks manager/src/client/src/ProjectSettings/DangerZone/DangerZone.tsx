import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useArchiveProject } from '@/api/projects'
import type { ProjectDto } from '@/api/types'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { SettingsSection } from '@/ProjectSettings/SettingsSection/SettingsSection'

/** Archive (or restore) the project, after a confirmation. The server has no delete, so archiving is the strongest action offered. */
export function DangerZone({ project, canEdit }: { project: ProjectDto; canEdit: boolean }) {
  const navigate = useNavigate()
  const archive = useArchiveProject(project.id)
  const [confirming, setConfirming] = useState(false)

  async function run() {
    await archive.mutateAsync(!project.isArchived)
    setConfirming(false)
    if (!project.isArchived) navigate('/projects')
  }

  return (
    <SettingsSection id="danger" title="Danger zone" danger description={project.isArchived ? 'This project is archived. It is hidden from the project list, and its data is kept.' : 'Archiving hides the project from the project list. Nothing is deleted, and it can be restored.'}>
      {archive.error && <Alert severity="error" sx={{ mb: 2 }}>{messageOf(archive.error)}</Alert>}
      <Box>
        <Button color={project.isArchived ? 'primary' : 'error'} variant="outlined" disabled={!canEdit} onClick={() => setConfirming(true)}>
          {project.isArchived ? 'Restore this project' : 'Archive this project'}
        </Button>
        {!canEdit && <Box sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>Only managers can archive a project</Box>}
      </Box>
      <Dialog open={confirming} onClose={() => setConfirming(false)}>
        <DialogTitle>{project.isArchived ? 'Restore' : 'Archive'} “{project.name}”?</DialogTitle>
        <DialogContent>
          <DialogContentText>{project.isArchived ? 'It will appear in the project list again' : 'Its sprints, work items and history are kept. It disappears from the project list until you restore it.'}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button color={project.isArchived ? 'primary' : 'error'} variant="contained" disabled={archive.isPending} onClick={run}>
            {project.isArchived ? 'Restore' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>
    </SettingsSection>
  )
}
