import Typography from '@mui/material/Typography'
import { useAuth } from '@/auth/useAuth'
import type { TeamMemberDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { MemberRow, type MemberStats } from '@/Team/MemberList/MemberRow/MemberRow'

interface MemberListProps {
  projectId: string
  ownerId: string
  currentUserId: string
  members: TeamMemberDto[]
  stats: Map<string, MemberStats>
}

export function MemberList({ projectId, ownerId, currentUserId, members, stats }: MemberListProps) {
  const { isManager } = useAuth()
  return (
    <Surface sx={{ flex: '999 1 520px' }}>
      <Typography variant="h2" component="h2">
        Members
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Capacity and workload for the current sprint. Pressing a member's board link shows only their tasks.
      </Typography>
      {members.map((member) => (
        <MemberRow key={member.id} member={member} stats={stats.get(member.id)} projectId={projectId} isOwner={member.id === ownerId} canRemove={isManager && member.id !== ownerId && member.id !== currentUserId} />
      ))}
    </Surface>
  )
}
