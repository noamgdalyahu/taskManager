import AddRounded from '@mui/icons-material/AddRounded'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { STATUS_LABEL, TASK_STATUSES, type TaskDto, type TaskStatus, type TeamMemberDto } from '@/api/types'
import { GRID_COLUMNS, StoryLane } from '@/Board/BoardGrid/StoryLane/StoryLane'
import { GroupByButton } from '@/Board/BoardGrid/GroupByButton/GroupByButton'
import { sumHours, type Lane, type LaneGrouping } from '@/Board/boardLanes'
import { HairlineButton } from '@/common/HairlineButton/HairlineButton'
import { Kbd } from '@/common/Kbd/Kbd'
import { formatHours } from '@/lib/format'
import { tokens } from '@/theme/tokens'

const DOT: Record<TaskStatus, string> = {
  ToDo: tokens.color.stTodo,
  InProgress: tokens.color.stProgress,
  InQA: tokens.color.stQa,
  Done: tokens.color.stDone,
}

interface BoardGridProps {
  lanes: Lane[]
  /** The visible tasks, for the column counts and hours. */
  visible: TaskDto[]
  /** Work in progress limits by status. A limit is judged against the unfiltered count in `totals`. */
  limits: Partial<Record<string, number>>
  totals: Record<TaskStatus, number>
  collapsed: Set<string>
  onToggleLane: (key: string) => void
  onToggleAll: () => void
  /** How the lanes are formed. */
  grouping: LaneGrouping
  onGrouping: (grouping: LaneGrouping) => void
  fullscreen: boolean
  onToggleFullscreen: () => void
  /** Extra toolbar buttons, for example the manager's board settings. */
  toolbarExtra?: ReactNode
  onAddTask: () => void
  members: Map<string, TeamMemberDto>
  memberList: TeamMemberDto[]
  criticalIds: Set<string>
  projectId: string
  onMove: (taskId: string, status: TaskStatus) => void
  onAssign: (taskId: string, memberId: string | null) => void
}

/** The board panel: toolbar, state column headers, one swimlane per group, and the quick-add button at the bottom. Scrolls sideways below 820px. */
export function BoardGrid({ lanes, visible, limits, totals, collapsed, onToggleLane, onToggleAll, grouping, onGrouping, fullscreen, onToggleFullscreen, onAddTask, toolbarExtra, members, memberList, criticalIds, projectId, onMove, onAssign }: BoardGridProps) {
  const allCollapsed = lanes.length > 0 && lanes.every((lane) => collapsed.has(lane.key))
  return (
    <Box
      component="section"
      aria-label="Board"
      sx={{
        border: `1px solid ${tokens.color.border}`,
        borderRadius: `${tokens.radius.card}px`,
        bgcolor: tokens.color.surface,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        ...(fullscreen && { position: 'fixed', inset: 0, zIndex: 1300, borderRadius: 0, overflowY: 'auto', bgcolor: tokens.color.canvas }),
      }}
    >
      {/* Above the board: the settings on the left, and every option for how the board is shown on the right. */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 1, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{toolbarExtra}</Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          <GroupByButton grouping={grouping} onGrouping={onGrouping} />
          <HairlineButton onClick={onToggleAll} disabled={lanes.length === 0}>
            {allCollapsed ? 'Expand all' : 'Collapse all'}
          </HairlineButton>
          <HairlineButton onClick={onToggleFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'Expand the board to full screen'} title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'} sx={{ width: 32, px: 0 }}>
            {fullscreen ? <FullscreenExitRounded aria-hidden /> : <FullscreenRounded aria-hidden />}
          </HairlineButton>
        </Box>
      </Box>

      <Box sx={{ overflowX: 'auto', p: 1 }}>
        <Box sx={{ minWidth: 820 }}>
          {/* One bordered strip: the grid gap shows the strong border colour, which draws a 1px line between the four headers.
              Lanes use the same outer border and the same grid, so the lines run straight down through them. */}
          <Box sx={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, gap: '1px', bgcolor: tokens.color.borderStrong, border: `1px solid ${tokens.color.borderStrong}`, borderRadius: `${tokens.radius.card}px`, overflow: 'hidden', mb: '10px' }}>
            {TASK_STATUSES.map((status) => {
              const inColumn = visible.filter((task) => task.status === status)
              const limit = limits[status]
              const over = limit !== undefined && totals[status] > limit
              return (
                <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: '10px 12px', minWidth: 0, bgcolor: tokens.color.cell }}>
                  <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: DOT[status], flex: '0 0 auto' }} />
                  <Box component="h2" sx={{ m: 0, fontSize: '0.8125rem', fontWeight: 500 }}>
                    {STATUS_LABEL[status]}
                  </Box>
                  <Box
                    component="span"
                    title={limit !== undefined ? `Work in progress limit: ${limit}` : undefined}
                    sx={{ fontFamily: tokens.font.mono, fontSize: '0.75rem', color: over ? tokens.color.danger : tokens.color.faint, fontWeight: over ? 600 : 400 }}
                  >
                    {inColumn.length}
                    {limit !== undefined && `/${limit}`}
                  </Box>
                  <Box component="span" sx={{ ml: 'auto', fontFamily: tokens.font.mono, fontSize: '0.75rem', color: tokens.color.faint }}>
                    {formatHours(sumHours(inColumn))}
                  </Box>
                </Box>
              )
            })}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {lanes.length === 0 && (
              <Typography sx={{ p: 4, textAlign: 'center', color: tokens.color.faint, border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px` }}>
                No work items match. Clear the filters to see the whole sprint.
              </Typography>
            )}
            {lanes.map((lane) => (
              <StoryLane key={lane.key || 'none'} lane={lane} expanded={!collapsed.has(lane.key)} onToggle={() => onToggleLane(lane.key)} members={members} memberList={memberList} criticalIds={criticalIds} projectId={projectId} onMove={onMove} onAssign={onAssign} />
            ))}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', p: 1.5, pt: 0.5 }}>
        <HairlineButton onClick={onAddTask} aria-keyshortcuts="Control+N" sx={{ gap: 1.25, px: 2, color: tokens.color.muted, borderStyle: 'dashed' }}>
          <AddRounded aria-hidden />
          Add a task to this sprint...
          <Kbd>Ctrl + N</Kbd>
        </HairlineButton>
      </Box>
    </Box>
  )
}
