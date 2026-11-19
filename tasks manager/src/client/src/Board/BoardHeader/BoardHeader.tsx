import AddRounded from '@mui/icons-material/AddRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import LayersOutlined from '@mui/icons-material/LayersOutlined'
import Box from '@mui/material/Box'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useState } from 'react'
import type { SprintDto, TeamMemberDto } from '@/api/types'
import { HairlineButton } from '@/common/HairlineButton/HairlineButton'
import { ThemeToggle } from '@/common/ThemeToggle/ThemeToggle'
import { tokens } from '@/theme/tokens'

interface BoardHeaderProps {
  sprint: SprintDto
  sprints: SprintDto[]
  onSelectSprint: (sprintId: string) => void
  members: TeamMemberDto[]
  /** Member ids (or "none") the board is filtered to. */
  selectedPeople: string[]
  onTogglePerson: (memberId: string) => void
  onClearPeople: () => void
  onNewItem: () => void
}

/** The page title and its actions: sprint selector, people filter, grouping, theme switch and "New item". */
export function BoardHeader({ sprint, sprints, onSelectSprint, members, selectedPeople, onTogglePerson, onClearPeople, onNewItem }: BoardHeaderProps) {
  const [sprintAnchor, setSprintAnchor] = useState<HTMLElement | null>(null)
  const [peopleAnchor, setPeopleAnchor] = useState<HTMLElement | null>(null)

  const peopleLabel = selectedPeople.length === 0 ? 'All people' : selectedPeople.length === 1 ? (members.find((member) => member.id === selectedPeople[0])?.name ?? 'Unassigned') : `${selectedPeople.length} people`

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

        <HairlineButton onClick={(event) => setPeopleAnchor(event.currentTarget)} aria-haspopup="menu" aria-expanded={!!peopleAnchor} aria-label={`People: ${peopleLabel}. Change who the board shows`}>
          {peopleLabel}
          <ExpandMoreRounded aria-hidden sx={{ color: tokens.color.faint }} />
        </HairlineButton>
        <Menu anchorEl={peopleAnchor} open={!!peopleAnchor} onClose={() => setPeopleAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <MenuItem selected={selectedPeople.length === 0} onClick={onClearPeople}>
            <ListItemText>All people</ListItemText>
          </MenuItem>
          {members.map((member) => (
            <MenuItem key={member.id} selected={selectedPeople.includes(member.id)} onClick={() => onTogglePerson(member.id)}>
              <ListItemText>{member.name}</ListItemText>
              {selectedPeople.includes(member.id) && <CheckRounded fontSize="small" sx={{ ml: 2 }} />}
            </MenuItem>
          ))}
        </Menu>

        {/* Lanes group by task type; there is nothing to choose, so this is a label, not a button. */}
        <Box
          title="Lanes group the work by task type"
          sx={{ display: { xs: 'none', sm: 'inline-flex' }, alignItems: 'center', gap: 0.75, height: 32, px: 1.25, boxSizing: 'border-box', border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.control}px`, color: tokens.color.muted, fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap', '& svg': { fontSize: 16 } }}
        >
          <LayersOutlined aria-hidden />
          Group by Type
        </Box>

        <ThemeToggle />
        <HairlineButton primary onClick={onNewItem}>
          <AddRounded aria-hidden />
          New item
        </HairlineButton>
      </Box>
    </Box>
  )
}
