import PersonRemoveOutlined from '@mui/icons-material/PersonRemoveOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TeamMemberDto } from '@/api/types'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { RemoveMemberDialog } from '@/Team/MemberList/MemberRow/RemoveMemberDialog/RemoveMemberDialog'

export interface MemberStats {
  tasks: number
  hours: number
  capacity: number
  sprintName?: string
}

interface MemberRowProps {
  stats?: MemberStats
  member: TeamMemberDto
  projectId: string
  isOwner: boolean
  canRemove: boolean
}

export function MemberRow({ member, stats, projectId, isOwner, canRemove }: MemberRowProps) {
  const [removing, setRemoving] = useState(false)

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', py: 1.75, borderBottom: 1, borderColor: 'divider' }}>
      <MemberAvatar id={member.id} name={member.name} size={36} />
      <Box sx={{ flex: '2 1 240px', minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600 }}>
          {member.name}{' '}
          <Typography component="span" variant="body2" color="text.secondary">
            {isOwner ? 'Owner' : member.role}
          </Typography>
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {member.email}
        </Typography>
      </Box>
      <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
        {stats && (
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            <strong>{stats.tasks}</strong> {stats.tasks === 1 ? 'task' : 'tasks'} · <strong>{Math.round(stats.hours * 10) / 10} h</strong> assigned of {Math.round(stats.capacity * 10) / 10} h
            {stats.sprintName ? ` in ${stats.sprintName}` : ''}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {member.weeklyCapacityHours} h/week
        </Typography>
      </Box>
      <Button size="small" variant="outlined" component={Link} to={`/p/${projectId}/board?assignee=${member.id}`} aria-label={`Show ${member.name} on the board`}>
        On the board
      </Button>
      <Box sx={{ flex: '0 0 44px' }}>
        {canRemove && (
          <IconButton aria-label={`Remove ${member.name}`} onClick={() => setRemoving(true)} sx={{ color: 'text.secondary' }}>
            <PersonRemoveOutlined />
          </IconButton>
        )}
      </Box>
      {removing && <RemoveMemberDialog projectId={projectId} memberId={member.id} memberName={member.name} onClose={() => setRemoving(false)} />}
    </Box>
  )
}
