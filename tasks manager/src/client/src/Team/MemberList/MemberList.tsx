import Typography from '@mui/material/Typography'
import { useAuth } from '@/auth/useAuth'
import type { TeamMemberDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { MemberRow } from '@/Team/MemberList/MemberRow/MemberRow'

interface MemberListProps {
  projectId: string
  ownerId: string
  currentUserId: string
  members: TeamMemberDto[]
}

export function MemberList({ projectId, ownerId, currentUserId, members }: MemberListProps) {
  const { isManager } = useAuth()
  return (
    <Surface sx={{ flex: '999 1 520px' }}>
      <Typography variant="h2" component="h2">
        Members
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Skills and weekly capacity are what the assignment algorithm works with.
      </Typography>
      {members.map((member) => (
        <MemberRow key={member.id} member={member} projectId={projectId} isOwner={member.id === ownerId} canRemove={isManager && member.id !== ownerId && member.id !== currentUserId} />
      ))}
    </Surface>
  )
}
