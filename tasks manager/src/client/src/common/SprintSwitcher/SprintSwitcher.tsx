import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import type { SprintDto } from '@/api/types'

interface SprintSwitcherProps {
  sprints: SprintDto[]
  currentId: string | undefined
  onSelect: (sprintId: string) => void
}

/** Pick which sprint a sprint-scoped screen shows. Navigation is the caller's job, so the same control fits every screen. */
export function SprintSwitcher({ sprints, currentId, onSelect }: SprintSwitcherProps) {
  if (sprints.length === 0) return null
  return (
    <TextField
      select
      size="small"
      label="Sprint"
      value={currentId ?? ''}
      onChange={(event) => onSelect(event.target.value)}
      sx={{ minWidth: 200 }}
    >
      {sprints.map((sprint) => (
        <MenuItem key={sprint.id} value={sprint.id}>
          {sprint.name} ({sprint.status.toLowerCase()})
        </MenuItem>
      ))}
    </TextField>
  )
}
