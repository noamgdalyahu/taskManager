import ButtonBase from '@mui/material/ButtonBase'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import { useState } from 'react'
import type { TeamMemberDto } from '@/api/types'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'

interface AssigneePickerProps {
  assignee?: TeamMemberDto
  members: TeamMemberDto[]
  editable: boolean
  onChange: (memberId: string | null) => void
}

/** Who the card belongs to. For managers it is a control: click the person to hand the card to someone else, right on the board. */
export function AssigneePicker({ assignee, members, editable, onChange }: AssigneePickerProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const face = assignee ? (
    <>
      <MemberAvatar id={assignee.id} name={assignee.name} size={24} />
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: 'text.primary' }}>
        {assignee.name}
      </Box>
    </>
  ) : (
    <Box component="span" sx={{ color: 'text.secondary' }}>
      Unassigned
    </Box>
  )

  if (!editable) {
    return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, fontSize: '0.8125rem' }}>{face}</Box>
  }

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchor(event.currentTarget)}
        // Pressing the picker must not start a drag of the card underneath it.
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        aria-label={`Assigned to ${assignee?.name ?? 'nobody'}. Change assignee`}
        aria-haspopup="menu"
        // A button centres its contents by default; the assignee reads from the card's left edge, like the title above it.
        sx={{ display: 'flex', justifyContent: 'flex-start', alignSelf: 'flex-start', maxWidth: '100%', alignItems: 'center', gap: 1, minWidth: 0, fontSize: '0.8125rem', borderRadius: 1.5, px: 0.5, py: 0.25, mx: -0.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}
      >
        {face}
      </ButtonBase>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
        <MenuItem
          selected={!assignee}
          onClick={() => {
            setAnchor(null)
            onChange(null)
          }}
        >
          <ListItemText>Unassigned</ListItemText>
        </MenuItem>
        {members.map((member) => (
          <MenuItem
            key={member.id}
            selected={member.id === assignee?.id}
            onClick={() => {
              setAnchor(null)
              onChange(member.id)
            }}
          >
            <MemberAvatar id={member.id} name={member.name} size={22} />
            <ListItemText sx={{ ml: 1.25 }}>{member.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
