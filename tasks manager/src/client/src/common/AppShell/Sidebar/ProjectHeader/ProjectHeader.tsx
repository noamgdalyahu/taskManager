import CheckRounded from '@mui/icons-material/CheckRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import FolderOutlined from '@mui/icons-material/FolderOutlined'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProject, useProjects } from '@/api/projects'
import { useAuth } from '@/auth/useAuth'
import { CreateMenu } from '@/common/AppShell/Sidebar/ProjectHeader/CreateMenu/CreateMenu'
import { toneFor } from '@/lib/tone'
import { tokens } from '@/theme/tokens'

/** "Team Sprint Manager (demo)" becomes "TS": the first letters of the first two words, like Azure DevOps' "AW". */
function projectInitials(name: string): string {
  const words = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '?') + (words[1]?.[0] ?? '')).toUpperCase()
}

interface ProjectHeaderProps {
  projectId: string
  collapsed: boolean
  onNavigate?: () => void
}

/** The project you are in, at the top of the navigation. Pressing it lists your projects, so switching never needs a detour. */
export function ProjectHeader({ projectId, collapsed, onNavigate }: ProjectHeaderProps) {
  const { isManager } = useAuth()
  const navigate = useNavigate()
  const project = useProject(projectId)
  const projects = useProjects()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const name = project.data?.name ?? ''
  const tone = toneFor(projectId)
  const mark = (
    <Box
      aria-hidden
      sx={{ width: 20, height: 20, borderRadius: `${tokens.radius.control}px`, bgcolor: tone.bg, color: tone.fg, display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: '0.5625rem', flex: '0 0 auto' }}
    >
      {name ? projectInitials(name) : ''}
    </Box>
  )

  const go = (to: string) => {
    setAnchor(null)
    onNavigate?.()
    navigate(to)
  }

  const button = (
    <ButtonBase
      onClick={(event) => setAnchor(event.currentTarget)}
      aria-label={collapsed ? `Project ${name}. Switch project` : undefined}
      aria-haspopup="menu"
      aria-expanded={!!anchor}
      sx={{
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'flex-start',
        alignItems: 'center',
        gap: 1,
        width: '100%',
        minHeight: 34,
        px: collapsed ? 0 : 1.25,
        borderRadius: `${tokens.radius.control}px`,
        textAlign: 'left',
        '&:hover': { bgcolor: tokens.color.wash },
      }}
    >
      {mark}
      {!collapsed && (
        <>
          <Typography noWrap sx={{ flex: 1, fontWeight: 500, fontSize: '0.8125rem' }}>
            {name || 'Project'}
          </Typography>
          <ExpandMoreRounded aria-hidden sx={{ fontSize: 16, color: tokens.color.faint }} />
        </>
      )}
    </ButtonBase>
  )

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {collapsed ? (
            <Tooltip title={name} placement="right">
              {button}
            </Tooltip>
          ) : (
            button
          )}
        </Box>
        {!collapsed && <CreateMenu projectId={projectId} onNavigate={onNavigate} />}
      </Box>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { sx: { minWidth: 240, mt: 0.5 } } }}>
        <Box sx={{ px: 2, py: 0.75, color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Your projects</Box>
        {(projects.data ?? []).map((candidate) => (
          <MenuItem key={candidate.id} selected={candidate.id === projectId} onClick={() => go(isManager ? `/p/${candidate.id}` : `/p/${candidate.id}/board`)}>
            <ListItemText>{candidate.name}</ListItemText>
            {candidate.id === projectId && <CheckRounded fontSize="small" color="primary" />}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => go('/projects')}>
          <ListItemIcon>
            <FolderOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>All projects</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
