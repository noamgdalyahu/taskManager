import FilterListRounded from '@mui/icons-material/FilterListRounded'
import Autocomplete from '@mui/material/Autocomplete'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import type { TeamMemberDto } from '@/api/types'
import { UNASSIGNED, type BoardFilter as Filter } from '@/Board/useBoardFilter'

interface BoardFilterProps {
  filter: Filter
  onChange: (filter: Filter) => void
  activeCount: number
  members: TeamMemberDto[]
  tags: string[]
  /** The signed-in user, offered first as "Me". */
  meId: string
}

interface AssigneeOption {
  id: string
  label: string
}

/** The filter icon of the board toolbar. Opens a panel from the icon itself (keyword, assignee, tag); a badge counts active filters. */
export function BoardFilter({ filter, onChange, activeCount, members, tags, meId }: BoardFilterProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const options: AssigneeOption[] = [
    { id: meId, label: 'Me' },
    { id: UNASSIGNED, label: 'Unassigned' },
    ...members.filter((member) => member.id !== meId).map((member) => ({ id: member.id, label: member.name })),
  ]

  return (
    <>
      <IconButton
        aria-label={activeCount > 0 ? `Filter, ${activeCount} active` : 'Filter'}
        aria-haspopup="dialog"
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ color: activeCount > 0 ? 'primary.main' : 'text.secondary', bgcolor: activeCount > 0 ? 'primary.light' : 'transparent' }}
      >
        <Badge badgeContent={activeCount} color="primary" invisible={activeCount === 0}>
          <FilterListRounded />
        </Badge>
      </IconButton>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 340, maxWidth: 'calc(100vw - 32px)', p: 2.5, mt: 1, borderRadius: 3 } } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h2" component="h2">
            Filter the board
          </Typography>
          <TextField
            label="Keyword"
            size="small"
            autoFocus
            value={filter.keyword}
            onChange={(event) => onChange({ ...filter, keyword: event.target.value })}
            placeholder="Search card titles"
          />
          <Autocomplete
            multiple
            size="small"
            options={options}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={options.filter((option) => filter.assignees.includes(option.id))}
            onChange={(_event, value) => onChange({ ...filter, assignees: value.map((option) => option.id) })}
            renderInput={(params) => <TextField {...params} label="Assigned to" />}
          />
          <Autocomplete
            multiple
            size="small"
            options={tags}
            value={filter.tags}
            onChange={(_event, value) => onChange({ ...filter, tags: value })}
            renderInput={(params) => <TextField {...params} label="Tags" />}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              The filter is part of the page address, so you can share it.
            </Typography>
            <Button size="small" onClick={() => onChange({ keyword: '', assignees: [], tags: [] })} disabled={activeCount === 0}>
              Clear
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  )
}
