import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import Box from '@mui/material/Box'
import type { SprintDto, TaskDto, TeamMemberDto } from '@/api/types'
import { CapacityBar } from '@/common/CapacityBar/CapacityBar'
import { HairlineButton } from '@/common/HairlineButton/HairlineButton'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { Surface } from '@/common/Surface/Surface'
import { memberCapacityHours } from '@/hooks/useCapacity'
import { formatDay } from '@/lib/format'
import { tokens } from '@/theme/tokens'

interface SprintCapacityProps {
  sprints: SprintDto[]
  /** The sprint being planned: the per-person list is for this one. */
  current: SprintDto
  tasks: TaskDto[]
  members: TeamMemberDto[]
  canStart: boolean
  starting: boolean
  onStart: (sprintId: string) => void
}

const STATUS_LABEL: Record<SprintDto['status'], string> = { Planned: 'Planned', Active: 'Active', Closed: 'Completed' }

/** Every open sprint with planned hours against capacity (amber over 90%, red over 100%), a Start sprint button on planned ones, and each person's share of the sprint being planned. */
export function SprintCapacity({ sprints, current, tasks, members, canStart, starting, onStart }: SprintCapacityProps) {
  const open = sprints.filter((sprint) => sprint.status !== 'Closed')
  return (
    <Surface component="section" aria-labelledby="sprint-capacity-heading" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box component="h2" id="sprint-capacity-heading" sx={{ m: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
        Sprints and capacity
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {open.map((sprint) => (
          <Box key={sprint.id} sx={{ p: 1.5, border: `1px solid ${sprint.id === current.id ? tokens.color.borderStrong : tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
              <Box dir="auto" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                {sprint.name}
              </Box>
              <Box component="span" sx={{ fontSize: '0.6875rem', color: tokens.color.faint }}>
                {STATUS_LABEL[sprint.status]}
              </Box>
            </Box>
            <Box sx={{ fontSize: '0.75rem', color: tokens.color.faint }}>
              {formatDay(sprint.startDate)} to {formatDay(sprint.endDate)}
            </Box>
            <CapacityBar planned={sprint.totalEstimateHours} capacity={sprint.teamCapacityHours} label={sprint.name} />
            {canStart && sprint.status === 'Planned' && (
              <HairlineButton onClick={() => onStart(sprint.id)} disabled={starting || sprint.taskCount === 0} aria-label={`Start ${sprint.name}`} sx={{ alignSelf: 'flex-start' }}>
                <PlayArrowRounded aria-hidden />
                Start sprint
              </HairlineButton>
            )}
          </Box>
        ))}
        {open.length === 0 && <Box sx={{ color: tokens.color.faint, fontSize: '0.8125rem' }}>No open sprints</Box>}
      </Box>

      <Box>
        <Box component="h3" sx={{ m: 0, mb: 1, fontSize: '0.8125rem', fontWeight: 500 }}>
          People in <span dir="auto">{current.name}</span>
        </Box>
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {members.map((member) => {
            const assigned = tasks.filter((task) => task.sprintId === current.id && task.assigneeId === member.id).reduce((sum, task) => sum + task.estimateHours, 0)
            return (
              <li key={member.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, fontSize: '0.8125rem', fontWeight: 500 }}>
                  <MemberAvatar id={member.id} name={member.name} size={20} />
                  {member.name}
                </Box>
                <CapacityBar planned={assigned} capacity={memberCapacityHours(member, current)} label={member.name} />
              </li>
            )
          })}
        </Box>
        <Box sx={{ mt: 1.5, fontSize: '0.75rem', color: tokens.color.faint }}>
          A person's capacity is their weekly hours over this sprint's working days. Days off are not recorded yet.
        </Box>
      </Box>
    </Surface>
  )
}
