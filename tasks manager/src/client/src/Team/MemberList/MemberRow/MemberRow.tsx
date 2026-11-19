import PersonRemoveOutlined from '@mui/icons-material/PersonRemoveOutlined'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import type { TeamMemberDto } from '@/api/types'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { RemoveMemberDialog } from '@/Team/MemberList/MemberRow/RemoveMemberDialog/RemoveMemberDialog'

interface MemberRowProps {
  member: TeamMemberDto
  projectId: string
  isOwner: boolean
  canRemove: boolean
}

export function MemberRow({ member, projectId, isOwner, canRemove }: MemberRowProps) {
  const [removing, setRemoving] = useState(false)
  const skills = Object.entries(member.skills).sort(([, a], [, b]) => b - a)

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', py: 1.75, borderBottom: 1, borderColor: 'divider' }}>
      <MemberAvatar id={member.id} name={member.name} size={36} />
      <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
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
      <Box sx={{ flex: '2 1 220px', display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {skills.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No skills listed. The assignment can only give them tasks that need no particular skill.
          </Typography>
        ) : (
          skills.map(([skill, level]) => <Chip key={skill} size="small" variant="outlined" label={`${skill} ${level}/5`} />)
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ flex: '0 0 80px', textAlign: 'right' }}>
        {member.weeklyCapacityHours} h/week
      </Typography>
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
