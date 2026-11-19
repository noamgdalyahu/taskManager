import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import { useUpdateProject } from '@/api/projects'
import type { ProjectDto } from '@/api/types'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { SettingsSection } from '@/ProjectSettings/SettingsSection/SettingsSection'

/** Name and description. Only managers can save; everyone else sees them read-only. */
export function GeneralSettings({ project, canEdit }: { project: ProjectDto; canEdit: boolean }) {
  const update = useUpdateProject(project.id)
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [saved, setSaved] = useState(false)
  const changed = name !== project.name || description !== project.description

  async function submit(event: FormEvent) {
    event.preventDefault()
    await update.mutateAsync({ name: name.trim(), description })
    setSaved(true)
  }

  return (
    <SettingsSection id="general" title="General" description="The name and description shown on the Overview page and in the project list.">
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2} sx={{ maxWidth: 560 }}>
          {update.error && <Alert severity="error">{messageOf(update.error)}</Alert>}
          {saved && !changed && <Alert severity="success">Saved.</Alert>}
          <TextField label="Project name" required value={name} disabled={!canEdit} onChange={(event) => { setName(event.target.value); setSaved(false) }} slotProps={{ htmlInput: { maxLength: 100 } }} />
          <TextField label="Description" multiline minRows={3} value={description} disabled={!canEdit} onChange={(event) => { setDescription(event.target.value); setSaved(false) }} />
          {canEdit && (
            <Box>
              <Button type="submit" variant="contained" disabled={!changed || name.trim() === '' || update.isPending}>
                Save changes
              </Button>
            </Box>
          )}
        </Stack>
      </Box>
    </SettingsSection>
  )
}
