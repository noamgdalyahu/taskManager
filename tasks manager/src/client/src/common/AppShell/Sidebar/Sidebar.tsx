import BarChartOutlined from '@mui/icons-material/BarChartOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import ChecklistOutlined from '@mui/icons-material/ChecklistOutlined'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import FolderOutlined from '@mui/icons-material/FolderOutlined'
import GroupsOutlined from '@mui/icons-material/GroupsOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import InsightsOutlined from '@mui/icons-material/InsightsOutlined'
import ViewKanbanOutlined from '@mui/icons-material/ViewKanbanOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { useMatch } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { CollapseToggle } from '@/common/AppShell/Sidebar/CollapseToggle/CollapseToggle'
import { NavGroup } from '@/common/AppShell/Sidebar/NavGroup/NavGroup'
import { NavItem, type NavLinkEntry } from '@/common/AppShell/Sidebar/NavItem/NavItem'
import { useNavState } from '@/common/AppShell/Sidebar/navStore'
import { ProjectHeader } from '@/common/AppShell/Sidebar/ProjectHeader/ProjectHeader'
import { UserMenu } from '@/common/AppShell/Sidebar/UserMenu/UserMenu'
import { material } from '@/theme/material'
import { tokens } from '@/theme/tokens'

type Entry = ({ kind: 'link' } & NavLinkEntry) | { kind: 'group'; id: string; label: string; icon: ReactNode; items: NavLinkEntry[] }

interface Navigation {
  main: Entry[]
  /** Pinned to the bottom, like "Project settings" in Azure DevOps. */
  footer: NavLinkEntry[]
}

/** What the navigation offers depends on who you are and whether a project is open. Labels name their contents. */
function navigationFor(isManager: boolean, projectId: string | undefined): Navigation {
  const projects: NavLinkEntry = { to: '/projects', label: 'Projects', icon: <FolderOutlined />, end: true }

  // Everyone sees the same screens; a member also gets "My tasks" on top.
  const mine: Entry[] = isManager ? [] : [{ kind: 'link', to: '/me/tasks', label: 'My tasks', icon: <ChecklistOutlined /> }]
  if (!projectId) return { main: [...mine, { kind: 'link', ...projects }], footer: [] }

  const base = `/p/${projectId}`
  return {
    main: [
      ...mine,
      { kind: 'link', to: base, label: 'Overview', icon: <HomeOutlined />, end: true },
      {
        kind: 'group',
        id: 'boards',
        label: 'Boards',
        icon: <ViewKanbanOutlined />,
        items: [
          { to: `${base}/board`, label: 'Sprint board', icon: <ViewKanbanOutlined /> },
          { to: `${base}/planning`, label: 'Sprint planning', icon: <CalendarMonthOutlined /> },
        ],
      },
      {
        kind: 'group',
        id: 'insights',
        label: 'Insights',
        icon: <InsightsOutlined />,
        items: [
          { to: `${base}/dashboard`, label: 'Dashboard', icon: <DashboardOutlined /> },
          { to: `${base}/reports`, label: 'Reports', icon: <BarChartOutlined /> },
        ],
      },
    ],
    footer: [{ to: `${base}/team`, label: 'Team', icon: <GroupsOutlined /> }],
  }
}

interface SidebarProps {
  onNavigate?: () => void
  /** The phone drawer is always wide and cannot collapse. */
  collapsible?: boolean
}

export function Sidebar({ onNavigate, collapsible = true }: SidebarProps) {
  const { isManager } = useAuth()
  const nav = useNavState()
  const projectId = useMatch('/p/:projectId/*')?.params.projectId
  const collapsed = collapsible && nav.collapsed
  const { main, footer } = navigationFor(isManager, projectId)

  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={[
        material(0.72),
        {
          height: { xs: '100%', md: '100dvh' },
          width: '100%',
          boxSizing: 'border-box',
          px: collapsed ? 0.75 : 1.5,
          py: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          overflowX: 'hidden',
          overflowY: 'auto',
          borderRight: `1px solid ${tokens.color.border}`,
        },
      ]}
    >
      {projectId ? (
        <Box sx={{ pb: 1.5 }}>
          <ProjectHeader projectId={projectId} collapsed={collapsed} onNavigate={onNavigate} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 1.25, px: collapsed ? 0 : 1.5, pb: 2.5, pt: 0.5 }}>
          <Box aria-hidden sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
            <ViewKanbanOutlined sx={{ fontSize: 17 }} />
          </Box>
          {!collapsed && <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.011em' }}>Team Sprint Manager</Typography>}
        </Box>
      )}

      {main.map((entry) =>
        entry.kind === 'link' ? (
          <NavItem key={entry.to} to={entry.to} label={entry.label} icon={entry.icon} end={entry.end} collapsed={collapsed} onNavigate={onNavigate} />
        ) : (
          <NavGroup
            key={entry.id}
            id={entry.id}
            label={entry.label}
            icon={entry.icon}
            items={entry.items}
            expanded={nav.isGroupOpen(entry.id)}
            onToggle={() => nav.toggleGroup(entry.id)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ),
      )}

      <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1.5 }}>
        {footer.map((entry) => (
          <NavItem key={entry.to} {...entry} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
        {/* Expanded: the toggle sits beside the profile. The 64 px rail has no room for two, so there it stacks below. */}
        <Box sx={{ display: 'flex', flexDirection: collapsed ? 'column' : 'row', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ flex: collapsed ? '0 0 auto' : 1, minWidth: 0, width: collapsed ? '100%' : 'auto' }}>
            <UserMenu onNavigate={onNavigate} collapsed={collapsed} />
          </Box>
          {collapsible && <CollapseToggle collapsed={collapsed} onToggle={nav.toggleCollapsed} />}
        </Box>
      </Box>
    </Box>
  )
}
