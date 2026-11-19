import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

export interface SkillRow {
  /** Stable key so editing a name does not remount the row and drop focus. */
  key: number
  name: string
  level: number
}

const LEVEL_LABEL: Record<number, string> = { 1: 'Beginner', 2: 'Basic', 3: 'Solid', 4: 'Strong', 5: 'Expert' }

interface SkillsEditorProps {
  rows: SkillRow[]
  onChange: (rows: SkillRow[]) => void
}

export function SkillsEditor({ rows, onChange }: SkillsEditorProps) {
  const update = (key: number, patch: Partial<SkillRow>) => onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box>
        <Typography variant="subtitle2">Skills</Typography>
        <Typography variant="body2" color="text.secondary">
          The planner only gives you tasks whose required skills you have, and prefers higher levels for critical work.
        </Typography>
      </Box>
      {rows.map((row) => (
        <Box key={row.key} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <TextField label="Skill" size="small" value={row.name} onChange={(event) => update(row.key, { name: event.target.value })} sx={{ flex: 1 }} />
          <TextField select label="Level" size="small" value={row.level} onChange={(event) => update(row.key, { level: Number(event.target.value) })} sx={{ flex: '0 0 150px' }}>
            {[1, 2, 3, 4, 5].map((level) => (
              <MenuItem key={level} value={level}>
                {level} · {LEVEL_LABEL[level]}
              </MenuItem>
            ))}
          </TextField>
          <IconButton aria-label={`Remove skill ${row.name || ''}`.trim()} onClick={() => onChange(rows.filter((candidate) => candidate.key !== row.key))} sx={{ color: 'text.secondary' }}>
            <DeleteOutlined />
          </IconButton>
        </Box>
      ))}
      <Box>
        <Button variant="outlined" size="small" startIcon={<AddRounded />} onClick={() => onChange([...rows, { key: Math.max(0, ...rows.map((row) => row.key)) + 1, name: '', level: 3 }])}>
          Add a skill
        </Button>
      </Box>
    </Box>
  )
}
