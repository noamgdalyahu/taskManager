import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { AtRiskTaskDto, TeamMemberDto } from '@/api/types'
import { CriticalPathChip } from '@/common/CriticalPathChip/CriticalPathChip'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { tokens } from '@/theme/tokens'

interface AtRiskRowProps {
  task: AtRiskTaskDto
  assignee?: TeamMemberDto
  to: string
}

export function AtRiskRow({ task, assignee, to }: AtRiskRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      {assignee ? <MemberAvatar id={assignee.id} name={assignee.name} /> : <Box sx={{ width: 26 }} />}
      <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
        <Typography component={Link} to={to} sx={{ fontWeight: 600, color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
          {task.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {task.reason}
        </Typography>
      </Box>
      {task.isCritical && <CriticalPathChip />}
      <Chip
        size="small"
        label="Needs attention"
        sx={{ bgcolor: tokens.color.warnBg, color: tokens.color.warnText }}
      />
    </Box>
  )
}
