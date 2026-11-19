import AddRounded from '@mui/icons-material/AddRounded'
import CreateNewFolderOutlined from '@mui/icons-material/CreateNewFolderOutlined'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import PostAddOutlined from '@mui/icons-material/PostAddOutlined'
import ButtonBase from '@mui/material/ButtonBase'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSprints } from '@/api/sprints'
import { useProjectTasks } from '@/api/tasks'
import { useAuth } from '@/auth/useAuth'
import { NewProjectDialog } from '@/common/NewProjectDialog/NewProjectDialog'
import { NewSprintDialog } from '@/common/NewSprintDialog/NewSprintDialog'
import { NewTaskDialog } from '@/common/NewTaskDialog/NewTaskDialog'
import { tokens } from '@/theme/tokens'

type Creating = 'task' | 'sprint' | 'project' | null

/** The "+" beside the project name: New work item, New sprint, New project. */
export function CreateMenu({ projectId, onNavigate }: { projectId: string; onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { isManager } = useAuth()
  const sprints = useSprints(projectId)
  const tasks = useProjectTasks(projectId)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [creating, setCreating] = useState<Creating>(null)

  const pick = (what: Creating) => {
    setAnchor(null)
    setCreating(what)
  }

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label="Create new"
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        sx={{ flex: '0 0 auto', width: 28, height: 28, borderRadius: `${tokens.radius.control}px`, border: `1px solid ${tokens.color.border}`, color: tokens.color.muted, '&:hover': { bgcolor: tokens.color.wash, borderColor: tokens.color.borderHover, color: tokens.color.text } }}
      >
        <AddRounded aria-hidden sx={{ fontSize: 16 }} />
      </ButtonBase>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200 } } }}>
        {isManager && (
          <MenuItem onClick={() => pick('task')}>
            <ListItemIcon>
              <PostAddOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>New work item</ListItemText>
          </MenuItem>
        )}
        {isManager && (
          <MenuItem onClick={() => pick('sprint')}>
            <ListItemIcon>
              <EventNoteOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>New sprint</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => pick('project')}>
          <ListItemIcon>
            <CreateNewFolderOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>New project</ListItemText>
        </MenuItem>
      </Menu>

      {creating === 'task' && <NewTaskDialog projectId={projectId} sprints={sprints.data ?? []} tasks={tasks.data ?? []} onClose={() => setCreating(null)} />}
      {creating === 'sprint' && (
        <NewSprintDialog
          open
          projectId={projectId}
          existingCount={sprints.data?.length ?? 0}
          onClose={() => setCreating(null)}
          onCreated={(sprint) => {
            setCreating(null)
            onNavigate?.()
            navigate(`/p/${projectId}/planning/${sprint.id}`)
          }}
        />
      )}
      <NewProjectDialog
        open={creating === 'project'}
        onClose={() => setCreating(null)}
        onCreated={(id) => {
          setCreating(null)
          onNavigate?.()
          navigate(`/p/${id}`)
        }}
      />
    </>
  )
}
