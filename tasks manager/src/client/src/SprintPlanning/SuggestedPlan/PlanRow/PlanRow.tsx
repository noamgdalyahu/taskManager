import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { motion } from 'motion/react'
import type { PlannedTaskDto, TeamMemberDto } from '@/api/types'
import { CriticalPathChip } from '@/common/CriticalPathChip/CriticalPathChip'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { formatHours } from '@/lib/format'
import { springs } from '@/theme/motion'

export const PLAN_GRID = { xs: '28px minmax(0, 1fr) 56px', md: '32px minmax(0, 1.5fr) 170px minmax(0, 1.6fr) 64px' }

interface PlanRowProps {
  row: PlannedTaskDto
  members: TeamMemberDto[]
  assigneeId: string | null
  onAssign: (memberId: string | null) => void
}

const cell = { py: 1.25, borderBottom: 1, borderColor: 'divider', minWidth: 0 }

export function PlanRow({ row, members, assigneeId, onAssign }: PlanRowProps) {
  return (
    // `layout` lets rows glide to their new place when the plan is recalculated instead of snapping (apple-design, section 3).
    <motion.div layout transition={springs.settle} style={{ display: 'contents' }}>
      <Box sx={{ ...cell, color: 'text.secondary' }}>{row.position + 1}</Box>
      <Box sx={{ ...cell, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {row.title}
        {row.isCritical && <CriticalPathChip />}
      </Box>
      {/* The manager can accept the suggestion or override it right here; the choice is saved at once. */}
      <Box sx={{ ...cell, gridColumn: { xs: '2 / -1', md: 'auto' }, order: { xs: 4, md: 'initial' } }}>
        <TextField
          select
          size="small"
          value={assigneeId ?? ''}
          onChange={(event) => onAssign(event.target.value || null)}
          fullWidth
          slotProps={{ htmlInput: { 'aria-label': `Assignee for ${row.title}` } }}
          sx={{ '& .MuiOutlinedInput-root': { minHeight: 36 } }}
        >
          <MenuItem value="">
            <Typography color="text.secondary">Unassigned</Typography>
          </MenuItem>
          {members.map((member) => (
            <MenuItem key={member.id} value={member.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MemberAvatar id={member.id} name={member.name} size={20} />
                {member.name}
              </Box>
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <Box sx={{ ...cell, color: 'text.secondary', gridColumn: { xs: '2 / -1', md: 'auto' }, order: { xs: 5, md: 'initial' } }}>{row.assignmentReason}</Box>
      <Box sx={{ ...cell, textAlign: 'right', order: { xs: 3, md: 'initial' } }}>{formatHours(row.earliestFinishHours - row.earliestStartHours)}</Box>
    </motion.div>
  )
}
