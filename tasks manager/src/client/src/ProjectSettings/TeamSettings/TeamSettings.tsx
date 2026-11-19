import Box from '@mui/material/Box'
import { Link } from 'react-router-dom'
import type { TeamMemberDto } from '@/api/types'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { SettingsSection } from '@/ProjectSettings/SettingsSection/SettingsSection'
import { tokens } from '@/theme/tokens'

/** Who is on the project and in what role. Adding and removing people is done on the Team page. */
export function TeamSettings({ members, ownerId, projectId }: { members: TeamMemberDto[]; ownerId: string; projectId: string }) {
  return (
    <SettingsSection id="team" title="Team and roles" description="The owner and managers plan sprints and edit work items; members move work and log time.">
      <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {members.map((member) => (
          <Box component="li" key={member.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderTop: `1px solid ${tokens.color.border}`, '&:first-of-type': { borderTop: 0 } }}>
            <MemberAvatar id={member.id} name={member.name} size={24} />
            <Box sx={{ flex: 1, minWidth: 0, fontSize: '0.8125rem', fontWeight: 500 }}>{member.name}</Box>
            <Box component="span" sx={{ fontSize: '0.75rem', color: tokens.color.muted }}>
              {member.id === ownerId ? 'Owner' : member.role}
            </Box>
          </Box>
        ))}
      </Box>
      <Box component={Link} to={`/p/${projectId}/team`} sx={{ display: 'inline-block', mt: 1.5, fontSize: '0.8125rem', color: tokens.color.focus }}>
        Manage members on the Team page
      </Box>
    </SettingsSection>
  )
}
