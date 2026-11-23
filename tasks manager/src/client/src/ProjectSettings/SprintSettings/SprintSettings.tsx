import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { useUpdateSprint } from '@/api/sprints'
import type { SprintDto } from '@/api/types'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { formatHours } from '@/lib/format'
import { SettingsSection } from '@/ProjectSettings/SettingsSection/SettingsSection'
import { tokens } from '@/theme/tokens'

function SprintRow({ sprint, projectId, canEdit }: { sprint: SprintDto; projectId: string; canEdit: boolean }) {
  const update = useUpdateSprint(projectId)
  const [name, setName] = useState(sprint.name)
  const [start, setStart] = useState(sprint.startDate)
  const [end, setEnd] = useState(sprint.endDate)
  const changed = name !== sprint.name || start !== sprint.startDate || end !== sprint.endDate
  const locked = !canEdit || sprint.status === 'Closed'
  const invalid = name.trim() === '' || end < start

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start', py: 1.5, borderTop: `1px solid ${tokens.color.border}` }}>
      <TextField size="small" label="Name" value={name} disabled={locked} onChange={(event) => setName(event.target.value)} sx={{ flex: '1 1 160px' }} />
      <TextField size="small" label="Starts" type="date" value={start} disabled={locked} onChange={(event) => setStart(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField size="small" label="Ends" type="date" value={end} disabled={locked} error={end < start} helperText={end < start ? 'Ends before it starts' : undefined} onChange={(event) => setEnd(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      <Box sx={{ flex: '0 0 auto', alignSelf: 'center', fontSize: '0.75rem', color: tokens.color.faint, minWidth: 150 }}>
        {sprint.status === 'Closed' ? 'Completed' : sprint.status} · capacity{' '}
        <Box component="span" sx={{ fontFamily: tokens.font.mono }}>
          {formatHours(sprint.teamCapacityHours)}
        </Box>
      </Box>
      {!locked && (
        <Button size="small" variant="outlined" disabled={!changed || invalid || update.isPending} onClick={() => update.mutate({ sprintId: sprint.id, body: { name: name.trim(), startDate: start, endDate: end } })} sx={{ alignSelf: 'center' }}>
          Save
        </Button>
      )}
      {update.error && <Alert severity="error" sx={{ flexBasis: '100%' }}>{messageOf(update.error)}</Alert>}
    </Box>
  )
}

/** Each sprint's name and dates. A sprint's capacity follows from its working days and the team's weekly hours, so it is shown, not typed. */
export function SprintSettings({ sprints, projectId, canEdit }: { sprints: SprintDto[]; projectId: string; canEdit: boolean }) {
  return (
    <SettingsSection id="sprints" title="Sprints" description="Dates and names. Capacity is the team's weekly hours spread over the sprint's working days, so it changes with the dates and with who is on the team.">
      {sprints.length === 0 ? <Box sx={{ color: tokens.color.faint, fontSize: '0.8125rem' }}>No sprints yet</Box> : sprints.map((sprint) => <SprintRow key={sprint.id} sprint={sprint} projectId={projectId} canEdit={canEdit} />)}
    </SettingsSection>
  )
}
