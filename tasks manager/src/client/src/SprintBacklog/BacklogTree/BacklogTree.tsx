import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import type { SprintDto, TaskDto, TeamMemberDto } from '@/api/types'
import { buildLanes, sumHours, type Lane } from '@/Board/boardLanes'
import { formatHours } from '@/lib/format'
import { TreeRow, type BacklogColumn } from '@/SprintBacklog/BacklogTree/TreeRow/TreeRow'
import { tokens } from '@/theme/tokens'

interface Section {
  key: string
  title: string
  tasks: TaskDto[]
}

interface BacklogTreeProps {
  /** The tasks after filtering. */
  tasks: TaskDto[]
  projectId: string
  sprints: SprintDto[]
  members: Map<string, TeamMemberDto>
  /** True: work items sit under their type as parents. False: a flat list per section. */
  parents: boolean
  collapsed: Set<string>
  onToggle: (key: string) => void
  columns: Set<BacklogColumn>
  canMove: boolean
  onMove: (task: TaskDto, sprintId: string | null) => void
}

const round = (hours: number) => Math.round(hours * 10) / 10

/**
 * Two sections, work not in any sprint first, then work already planned. Inside each, work items sit under their type
 * (the parent), which rolls up remaining and done hours. Work items have no parent of their own in the data.
 */
export function BacklogTree({ tasks, projectId, sprints, members, parents, collapsed, onToggle, columns, canMove, onMove }: BacklogTreeProps) {
  const sprintName = new Map(sprints.map((sprint) => [sprint.id, sprint.name]))
  const sections: Section[] = [
    { key: 'free', title: 'Not in any sprint', tasks: tasks.filter((task) => task.sprintId === null) },
    { key: 'planned', title: 'In a sprint', tasks: tasks.filter((task) => task.sprintId !== null) },
  ]

  const rowFor = (task: TaskDto) => (
    <TreeRow key={task.id} task={task} projectId={projectId} sprints={sprints} assignee={task.assigneeId ? members.get(task.assigneeId) : undefined} sprintName={task.sprintId ? sprintName.get(task.sprintId) : undefined} columns={columns} canMove={canMove} onMove={onMove} />
  )

  return (
    <Box sx={{ border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, bgcolor: tokens.color.surface, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', gap: 1, px: 1.5, py: 0.75, bgcolor: tokens.color.cell, color: tokens.color.faint, fontSize: '0.75rem' }} aria-hidden>
        <Box sx={{ flex: 1 }}>Title</Box>
        <Box sx={{ width: 76, textAlign: 'right' }}>Remaining</Box>
        <Box sx={{ width: 76, textAlign: 'right' }}>Done</Box>
      </Box>
      {tasks.length === 0 && <Box sx={{ p: 4, textAlign: 'center', color: tokens.color.faint, fontSize: '0.8125rem' }}>No work items match these filters</Box>}
      {sections
        .filter((section) => section.tasks.length > 0)
        .map((section) => (
          <Box key={section.key} component="section" aria-label={section.title}>
            <Box sx={{ px: 1.5, py: 0.75, bgcolor: tokens.color.cell, borderTop: `1px solid ${tokens.color.border}`, fontSize: '0.75rem', fontWeight: 600 }}>
              {section.title}{' '}
              <Box component="span" sx={{ color: tokens.color.faint, fontFamily: tokens.font.mono, fontWeight: 400 }}>
                {section.tasks.length}
              </Box>
            </Box>
            {parents
              ? buildLanes(section.tasks).map((lane: Lane) => {
                  const key = `${section.key}:${lane.key}`
                  const open = !collapsed.has(key)
                  const done = lane.hoursByStatus.Done
                  return (
                    <Box key={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, minHeight: 40, borderTop: `1px solid ${tokens.color.border}` }}>
                        <ButtonBase onClick={() => onToggle(key)} aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} ${lane.title}`} sx={{ width: 24, height: 24, borderRadius: `${tokens.radius.control}px`, color: tokens.color.faint, '&:hover': { bgcolor: tokens.color.wash } }}>
                          <ExpandMoreRounded aria-hidden sx={{ fontSize: 16, transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 150ms ease-out' }} />
                        </ButtonBase>
                        <Box dir="ltr" sx={{ flex: 1, fontSize: '0.8125rem', fontWeight: 600 }}>
                          {lane.title}{' '}
                          <Box component="span" sx={{ color: tokens.color.faint, fontFamily: tokens.font.mono, fontWeight: 400 }}>
                            {lane.tasks.length}
                          </Box>
                        </Box>
                        <Box component="span" sx={{ width: 76, textAlign: 'right', fontFamily: tokens.font.mono, fontSize: '0.75rem' }}>
                          {formatHours(round(lane.totalHours - done))}
                        </Box>
                        <Box component="span" sx={{ width: 76, textAlign: 'right', fontFamily: tokens.font.mono, fontSize: '0.75rem', color: tokens.color.faint }}>
                          {formatHours(round(done))}
                        </Box>
                      </Box>
                      {open && lane.tasks.map(rowFor)}
                    </Box>
                  )
                })
              : section.tasks.map(rowFor)}
            {!parents && (
              <Box sx={{ px: 1.5, py: 0.75, borderTop: `1px solid ${tokens.color.border}`, fontSize: '0.75rem', color: tokens.color.faint }}>
                Total {formatHours(round(sumHours(section.tasks)))}
              </Box>
            )}
          </Box>
        ))}
    </Box>
  )
}
