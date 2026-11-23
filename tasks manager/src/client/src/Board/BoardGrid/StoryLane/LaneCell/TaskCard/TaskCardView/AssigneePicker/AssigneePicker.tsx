import ButtonBase from '@mui/material/ButtonBase'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import { useState } from 'react'
import type { TeamMemberDto } from '@/api/types'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { tokens } from '@/theme/tokens'

interface AssigneePickerProps {
  assignee?: TeamMemberDto
  members: TeamMemberDto[]
  editable: boolean
  onChange: (memberId: string | null) => void
}

const firstName = (name: string) => name.trim().split(/\s+/)[0]

/** Who the card belongs to: a 20px avatar and the first name, or a dashed circle and "Unassigned". Anyone can hand the card to someone else from here. */
export function AssigneePicker({ assignee, members, editable, onChange }: AssigneePickerProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const face = assignee ? (
    <>
      <MemberAvatar id={assignee.id} name={assignee.name} size={20} />
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, color: tokens.color.text }}>
        {firstName(assignee.name)}
      </Box>
    </>
  ) : (
    <>
      <Box aria-hidden sx={{ width: 20, height: 20, borderRadius: '50%', border: `1px dashed ${tokens.color.borderHover}`, boxSizing: 'border-box', flex: '0 0 auto' }} />
      <Box component="span" sx={{ color: tokens.color.faint }}>
        Unassigned
      </Box>
    </>
  )

  if (!editable) {
    return <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, fontSize: '0.75rem' }}>{face}</Box>
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
        sx={{ display: 'flex', justifyContent: 'flex-start', alignSelf: 'flex-start', maxWidth: '100%', alignItems: 'center', gap: 0.75, minWidth: 0, fontSize: '0.75rem', borderRadius: `${tokens.radius.control}px`, px: 0.5, py: 0.25, mx: -0.5, '&:hover': { bgcolor: tokens.color.wash } }}
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
            <MemberAvatar id={member.id} name={member.name} size={20} />
            <ListItemText sx={{ ml: 1.25 }}>{member.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
