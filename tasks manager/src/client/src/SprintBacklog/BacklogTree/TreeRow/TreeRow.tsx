import DragIndicatorRounded from '@mui/icons-material/DragIndicatorRounded'
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useDraggable } from '@dnd-kit/core'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { SprintDto, TaskDto, TeamMemberDto } from '@/api/types'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { StatusChip } from '@/common/StatusChip/StatusChip'
import { TypeChip } from '@/common/TypeChip/TypeChip'
import { formatHours, shortId } from '@/lib/format'
import { tokens } from '@/theme/tokens'

export type BacklogColumn = 'state' | 'assignee' | 'hours'

interface TreeRowProps {
  task: TaskDto
  projectId: string
  sprints: SprintDto[]
  assignee?: TeamMemberDto
  sprintName?: string
  columns: Set<BacklogColumn>
  canMove: boolean
  onMove: (task: TaskDto, sprintId: string | null) => void
}

/** One work item in the backlog tree: a drag handle, id, title, type, and the chosen columns. "More" is the keyboard way to move it. */
export function TreeRow({ task, projectId, sprints, assignee, sprintName, columns, canMove, onMove }: TreeRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, disabled: !canMove })
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  return (
    <Box
      ref={setNodeRef}
      sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 5, pr: 1, minHeight: 40, borderTop: `1px solid ${tokens.color.border}`, opacity: isDragging ? 0.4 : 1, '&:hover': { bgcolor: tokens.color.wash } }}
    >
      {canMove ? (
        <ButtonBase {...attributes} {...listeners} aria-label={`Drag ${task.title} to a sprint`} sx={{ width: 20, height: 24, borderRadius: `${tokens.radius.key}px`, color: tokens.color.faint, cursor: 'grab', touchAction: 'none' }}>
          <DragIndicatorRounded aria-hidden sx={{ fontSize: 16 }} />
        </ButtonBase>
      ) : (
        <Box sx={{ width: 20 }} />
      )}
      <Box component="span" sx={{ flex: '0 0 auto', fontFamily: tokens.font.mono, fontSize: '0.6875rem', color: tokens.color.faint }}>
        #{shortId(task.id)}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box component={Link} to={`/p/${projectId}/tasks/${task.id}`} dir="ltr" sx={{ color: tokens.color.text, fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          {task.title}
        </Box>
        <Box sx={{ mt: 0.25, display: 'flex', gap: 0.75, alignItems: 'center', fontSize: '0.75rem', color: tokens.color.faint }}>
          <TypeChip type={task.type} />
          <span>{sprintName ?? 'Backlog'}</span>
        </Box>
      </Box>
      {columns.has('state') && (
        <Box sx={{ flex: '0 0 auto', display: { xs: 'none', sm: 'block' } }}>
          <StatusChip status={task.status} />
        </Box>
      )}
      {columns.has('assignee') && (
        <Box sx={{ flex: '0 0 96px', display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.75, fontSize: '0.75rem', minWidth: 0 }}>
          {assignee ? (
            <>
              <MemberAvatar id={assignee.id} name={assignee.name} size={20} />
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {assignee.name.split(/\s+/)[0]}
              </Box>
            </>
          ) : (
            <Box component="span" sx={{ color: tokens.color.faint }}>
              Unassigned
            </Box>
          )}
        </Box>
      )}
      {columns.has('hours') && (
        <Box component="span" sx={{ flex: '0 0 56px', textAlign: 'right', fontFamily: tokens.font.mono, fontSize: '0.75rem', color: tokens.color.muted }}>
          {formatHours(task.estimateHours)}
        </Box>
      )}
      {canMove ? (
        <>
          <ButtonBase onClick={(event) => setAnchor(event.currentTarget)} aria-label={`Move ${task.title} to a sprint`} aria-haspopup="menu" sx={{ width: 28, height: 28, borderRadius: `${tokens.radius.control}px`, color: tokens.color.faint, '&:hover': { bgcolor: tokens.color.wash, color: tokens.color.text } }}>
            <MoreHorizRounded aria-hidden sx={{ fontSize: 16 }} />
          </ButtonBase>
          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            {sprints
              .filter((sprint) => sprint.status !== 'Closed' && sprint.id !== task.sprintId)
              .map((sprint) => (
                <MenuItem
                  key={sprint.id}
                  onClick={() => {
                    setAnchor(null)
                    onMove(task, sprint.id)
                  }}
                >
                  <ListItemText>Move to {sprint.name}</ListItemText>
                </MenuItem>
              ))}
            {task.sprintId && (
              <MenuItem
                onClick={() => {
                  setAnchor(null)
                  onMove(task, null)
                }}
              >
                <ListItemText>Move to the backlog</ListItemText>
              </MenuItem>
            )}
          </Menu>
        </>
      ) : (
        <Box sx={{ width: 28 }} />
      )}
    </Box>
  )
}
