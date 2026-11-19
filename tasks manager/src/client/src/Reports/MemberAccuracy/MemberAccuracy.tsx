import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { MemberReportDto } from '@/api/types'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { ProgressBar } from '@/common/ProgressBar/ProgressBar'
import { Surface } from '@/common/Surface/Surface'
import { formatHours } from '@/lib/format'

export function MemberAccuracy({ members }: { members: MemberReportDto[] }) {
  return (
    <Surface sx={{ flex: '1 1 340px' }}>
      <Typography variant="h2" component="h2" sx={{ mb: 0.25 }}>
        Estimate accuracy by person
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.75 }}>
        Across all finished tasks. Use it to calibrate future estimates, not to rank people.
      </Typography>
      {members.length === 0 && <Typography color="text.secondary">Nobody has finished a task with logged time yet.</Typography>}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {members.map((member) => (
          <Box key={member.memberId} sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MemberAvatar id={member.memberId} name={member.name} />
              <Typography sx={{ fontWeight: 600 }}>{member.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                {formatHours(member.completedEstimateHours)} estimated, {formatHours(member.loggedHours)} logged
              </Typography>
            </Box>
            <ProgressBar value={Math.min(100, member.accuracyPercent)} label={`${member.name}: ${Math.round(member.accuracyPercent)} percent estimate accuracy`} />
            <Typography variant="caption" color="text.secondary">
              {Math.round(member.accuracyPercent)}% accuracy across {member.tasksCompleted} {member.tasksCompleted === 1 ? 'task' : 'tasks'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Surface>
  )
}
