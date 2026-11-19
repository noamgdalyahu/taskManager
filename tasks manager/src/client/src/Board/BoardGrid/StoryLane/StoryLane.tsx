import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import { TASK_STATUSES, type TaskStatus, type TeamMemberDto } from '@/api/types'
import { LaneCell } from '@/Board/BoardGrid/StoryLane/LaneCell/LaneCell'
import { LaneRollup } from '@/Board/BoardGrid/StoryLane/LaneRollup/LaneRollup'
import type { Lane } from '@/Board/boardLanes'
import { formatHours } from '@/lib/format'
import { tokens } from '@/theme/tokens'

interface StoryLaneProps {
  lane: Lane
  expanded: boolean
  onToggle: () => void
  members: Map<string, TeamMemberDto>
  memberList: TeamMemberDto[]
  criticalIds: Set<string>
  projectId: string
  onMove: (taskId: string, status: TaskStatus) => void
  onAssign: (taskId: string, memberId: string | null) => void
}

export const GRID_COLUMNS = 'repeat(4, minmax(0, 1fr))'

/** A bordered swimlane on the cell background: a header with the rollup, then one cell per state with 8px gaps and padding. */
export function StoryLane({ lane, expanded, onToggle, members, memberList, criticalIds, projectId, onMove, onAssign }: StoryLaneProps) {
  const bodyId = `lane-${lane.key || 'none'}`.replace(/\s+/g, '-')
  return (
    <Box component="section" aria-label={lane.title} sx={{ border: `1px solid ${tokens.color.borderStrong}`, borderRadius: `${tokens.radius.card}px`, bgcolor: tokens.color.cell, overflow: 'hidden' }}>
      {/* A 1px line under the header separates it from the columns (only while the lane is open, so a folded lane has no double edge). */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 0.75, minHeight: 44, flexWrap: 'wrap', borderBottom: expanded ? `1px solid ${tokens.color.borderStrong}` : 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 220px', minWidth: 0 }}>
          <ButtonBase
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={bodyId}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${lane.title}`}
            sx={{ width: 24, height: 24, borderRadius: `${tokens.radius.control}px`, color: tokens.color.faint, flex: '0 0 auto', '&:hover': { bgcolor: tokens.color.wash, color: tokens.color.text } }}
          >
            <ExpandMoreRounded aria-hidden sx={{ fontSize: 16, transform: expanded ? 'none' : 'rotate(-90deg)', transition: 'transform 150ms ease-out' }} />
          </ButtonBase>
          <AssignmentOutlined aria-hidden sx={{ fontSize: 16, color: tokens.color.faint, flex: '0 0 auto' }} />
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}>
            <Box component="h3" dir="ltr" sx={{ m: 0, fontSize: '0.8125rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lane.title}
            </Box>
            <Box sx={{ flex: '0 0 auto', fontSize: '0.75rem', color: tokens.color.faint, whiteSpace: 'nowrap' }}>
              <Box component="span" sx={{ fontFamily: tokens.font.mono }}>
                {lane.tasks.length}
              </Box>{' '}
              {lane.tasks.length === 1 ? 'task' : 'tasks'} ·{' '}
              <Box component="span" sx={{ fontFamily: tokens.font.mono }}>
                {formatHours(lane.totalHours)}
              </Box>
            </Box>
          </Box>
        </Box>
        <LaneRollup lane={lane} />
      </Box>
      {expanded && (
        // The gap shows the strong border colour behind the cells: a 1px line between columns, even when a column is empty.
        <Box id={bodyId} sx={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, gap: '1px', bgcolor: tokens.color.borderStrong }}>
          {TASK_STATUSES.map((status) => (
            <LaneCell key={status} laneKey={lane.key} status={status} tasks={lane.byStatus[status]} members={members} memberList={memberList} criticalIds={criticalIds} projectId={projectId} onMove={onMove} onAssign={onAssign} />
          ))}
        </Box>
      )}
    </Box>
  )
}
