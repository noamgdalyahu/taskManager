import AddRounded from '@mui/icons-material/AddRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import Box from '@mui/material/Box'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useState } from 'react'
import type { SprintDto } from '@/api/types'
import { HairlineButton } from '@/common/HairlineButton/HairlineButton'
import { ThemeToggle } from '@/common/ThemeToggle/ThemeToggle'
import { tokens } from '@/theme/tokens'

interface BoardHeaderProps {
  sprint: SprintDto
  sprints: SprintDto[]
  onSelectSprint: (sprintId: string) => void
  onNewItem: () => void
}

/** The page title and its actions: sprint selector, theme switch and "New item". */
export function BoardHeader({ sprint, sprints, onSelectSprint, onNewItem }: BoardHeaderProps) {
  const [sprintAnchor, setSprintAnchor] = useState<HTMLElement | null>(null)


  return (
    <Box component="header" sx={{ minHeight: 76, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
      <Box component="h1" sx={{ m: 0, fontSize: '1.3125rem', fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
        Sprint board
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <HairlineButton onClick={(event) => setSprintAnchor(event.currentTarget)} aria-haspopup="menu" aria-expanded={!!sprintAnchor} aria-label={`Sprint: ${sprint.name}. Change sprint`}>
          <Box component="span" dir="auto">
            {sprint.name}
          </Box>
          <ExpandMoreRounded aria-hidden sx={{ color: tokens.color.faint }} />
        </HairlineButton>
        <Menu anchorEl={sprintAnchor} open={!!sprintAnchor} onClose={() => setSprintAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
          {sprints.map((candidate) => (
            <MenuItem
              key={candidate.id}
              selected={candidate.id === sprint.id}
              onClick={() => {
                setSprintAnchor(null)
                onSelectSprint(candidate.id)
              }}
            >
              <ListItemText>
                {candidate.name} ({candidate.status.toLowerCase()})
              </ListItemText>
              {candidate.id === sprint.id && <CheckRounded fontSize="small" sx={{ ml: 2 }} />}
            </MenuItem>
          ))}
        </Menu>



        <ThemeToggle />
        <HairlineButton primary onClick={onNewItem}>
          <AddRounded aria-hidden />
          New item
        </HairlineButton>
      </Box>
    </Box>
  )
}
