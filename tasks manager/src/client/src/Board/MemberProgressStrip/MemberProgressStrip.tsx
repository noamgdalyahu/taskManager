import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import type { TaskDto, TeamMemberDto } from '@/api/types'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { ProgressBar } from '@/common/ProgressBar/ProgressBar'
import { Surface } from '@/common/Surface/Surface'
import { formatHours, percent } from '@/lib/format'

interface MemberProgressStripProps {
  tasks: TaskDto[]
  members: TeamMemberDto[]
}

/**
 * Each person's finished hours against what they were given this sprint. Hidden when nobody has been assigned anything.
 * On a phone it folds to one summary line: five stacked rows would push the board itself below the fold.
 */
export function MemberProgressStrip({ tasks, members }: MemberProgressStripProps) {
  const isPhone = useMediaQuery(useTheme().breakpoints.down('sm'))
  const [expanded, setExpanded] = useState(false)

  const rows = members
    .map((member) => {
      const mine = tasks.filter((task) => task.assigneeId === member.id)
      const total = mine.reduce((sum, task) => sum + task.estimateHours, 0)
      const done = mine.filter((task) => task.status === 'Done').reduce((sum, task) => sum + task.estimateHours, 0)
      return { member, total, done }
    })
    .filter((row) => row.total > 0)

  if (rows.length === 0) return null

  if (isPhone && !expanded) {
    const done = rows.reduce((sum, row) => sum + row.done, 0)
    const total = rows.reduce((sum, row) => sum + row.total, 0)
    return (
      <Surface padding={1.5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <Typography variant="body2">
          <strong>{rows.length} people</strong>, {formatHours(done)} of {formatHours(total)} done
        </Typography>
        <Button size="small" variant="outlined" onClick={() => setExpanded(true)} aria-expanded={false}>
          Details
        </Button>
      </Surface>
    )
  }

  return (
    <Surface sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {rows.map(({ member, total, done }) => (
        <Box key={member.id} sx={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MemberAvatar id={member.id} name={member.name} />
            <Typography sx={{ fontWeight: 600 }}>{member.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              {Math.round(done * 10) / 10} of {Math.round(total * 10) / 10} h done
            </Typography>
          </Box>
          <ProgressBar value={percent(done, total)} label={`${member.name}: ${Math.round(done)} of ${Math.round(total)} hours done`} />
        </Box>
      ))}
      {isPhone && (
        <Button size="small" variant="outlined" onClick={() => setExpanded(false)} aria-expanded sx={{ alignSelf: 'flex-start' }}>
          Hide details
        </Button>
      )}
    </Surface>
  )
}
