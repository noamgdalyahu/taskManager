import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import type { SprintDto, TaskDto, TeamMemberDto } from '@/api/types'
import { sumHours } from '@/Board/boardLanes'
import { memberCapacityHours } from '@/hooks/useCapacity'
import { toneFor } from '@/lib/tone'
import { tokens } from '@/theme/tokens'

interface TeamCapacityProps {
  sprint: SprintDto
  /** Every task of the sprint: a person's numbers always cover their whole sprint, whatever the filter. */
  allTasks: TaskDto[]
  members: TeamMemberDto[]
  selected: string[]
  onTogglePerson: (memberId: string) => void
}

const round = (hours: number) => Math.round(hours * 10) / 10

/** Who has how much of the sprint. Busiest first; pressing a person filters the board to them. */
export function TeamCapacity({ sprint, allTasks, members, selected, onTogglePerson }: TeamCapacityProps) {
  const rows = members
    .map((member) => {
      const mine = allTasks.filter((task) => task.assigneeId === member.id)
      return { member, count: mine.length, assigned: sumHours(mine), done: sumHours(mine.filter((task) => task.status === 'Done')), capacity: memberCapacityHours(member, sprint) }
    })
    .sort((a, b) => b.assigned - a.assigned || b.capacity - a.capacity || a.member.name.localeCompare(b.member.name))

  return (
    <Box component="section" aria-labelledby="team-capacity-heading">
      <Box component="h2" id="team-capacity-heading" sx={{ m: 0, mb: 1, fontSize: '0.8125rem', fontWeight: 500 }}>
        Team capacity
      </Box>
      <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {rows.map(({ member, count, assigned, done, capacity }) => {
          const pressed = selected.includes(member.id)
          return (
            <li key={member.id}>
              <ButtonBase
                onClick={() => onTogglePerson(member.id)}
                aria-pressed={pressed}
                aria-label={`${member.name}: ${count} tasks, ${round(assigned)} hours assigned, ${round(done)} of ${round(capacity)} hours done. Filter the board to ${member.name}`}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1,
                  py: 0.75,
                  textAlign: 'left',
                  borderRadius: `${tokens.radius.control}px`,
                  border: `1px solid ${pressed ? tokens.color.borderStrong : 'transparent'}`,
                  bgcolor: pressed ? tokens.color.wash : 'transparent',
                  '&:hover': { bgcolor: tokens.color.wash },
                }}
              >
                <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: toneFor(member.id).base, flex: '0 0 auto' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</Box>
                  <Box sx={{ fontSize: '0.75rem', color: tokens.color.faint }}>
                    {count === 0 ? (
                      'No tasks yet'
                    ) : (
                      <>
                        <Box component="span" sx={{ fontFamily: tokens.font.mono }}>
                          {count}
                        </Box>{' '}
                        {count === 1 ? 'task' : 'tasks'} ·{' '}
                        <Box component="span" sx={{ fontFamily: tokens.font.mono }}>
                          {round(assigned)} h
                        </Box>{' '}
                        assigned
                      </>
                    )}
                  </Box>
                </Box>
                <Box sx={{ flex: '0 0 auto', fontFamily: tokens.font.mono, fontSize: '0.75rem', color: tokens.color.muted, whiteSpace: 'nowrap' }}>
                  {round(done)} / {round(capacity)} h
                </Box>
              </ButtonBase>
            </li>
          )
        })}
      </Box>
    </Box>
  )
}
