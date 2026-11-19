import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'

interface SprintRangeProps {
  /** Anything with a name and a start date; the list is shown oldest first. */
  sprints: { name: string; startDate: string }[]
  /** From and to, as sprint start dates. */
  range: [string, string]
  onRange: (range: [string, string]) => void
}

const field = { minWidth: 140, '& .MuiInputBase-root': { minHeight: 32, fontSize: '0.8125rem' } }

/** "From sprint" and "To sprint": the range a sprint report covers. */
export function SprintRange({ sprints, range, onRange }: SprintRangeProps) {
  const ordered = [...sprints].sort((a, b) => a.startDate.localeCompare(b.startDate))
  return (
    <>
      <TextField select size="small" label="From sprint" value={range[0]} onChange={(event) => onRange([event.target.value, range[1] < event.target.value ? event.target.value : range[1]])} sx={field}>
        {ordered.map((sprint) => (
          <MenuItem key={sprint.startDate} value={sprint.startDate}>
            {sprint.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField select size="small" label="To sprint" value={range[1]} onChange={(event) => onRange([range[0] > event.target.value ? event.target.value : range[0], event.target.value])} sx={field}>
        {ordered.map((sprint) => (
          <MenuItem key={sprint.startDate} value={sprint.startDate}>
            {sprint.name}
          </MenuItem>
        ))}
      </TextField>
    </>
  )
}
