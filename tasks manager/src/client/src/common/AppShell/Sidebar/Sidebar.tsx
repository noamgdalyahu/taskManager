import BarChartOutlined from '@mui/icons-material/BarChartOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import ChecklistOutlined from '@mui/icons-material/ChecklistOutlined'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import FolderOutlined from '@mui/icons-material/FolderOutlined'
import FormatListBulletedRounded from '@mui/icons-material/FormatListBulletedRounded'
import GroupsOutlined from '@mui/icons-material/GroupsOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import InsightsOutlined from '@mui/icons-material/InsightsOutlined'
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined'
import TuneOutlined from '@mui/icons-material/TuneOutlined'
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
import { SearchButton } from '@/common/AppShell/Sidebar/SearchButton/SearchButton'
import { SprintCard } from '@/common/AppShell/Sidebar/SprintCard/SprintCard'
import { UserMenu } from '@/common/AppShell/Sidebar/UserMenu/UserMenu'
import { tokens } from '@/theme/tokens'

type Entry = ({ kind: 'link' } & NavLinkEntry) | { kind: 'group'; id: string; label: string; icon: ReactNode; items: NavLinkEntry[] }

/** A group's icon carries the only colour in the navigation: green for Boards, indigo for Analytics. */
const tinted = (icon: ReactNode, color: string) => (
  <Box component="span" sx={{ display: 'inline-flex', color }}>
    {icon}
  </Box>
)

/** What the navigation offers depends on whether a project is open. Labels name their contents. */
function navigationFor(isManager: boolean, projectId: string | undefined): { main: Entry[]; settings?: NavLinkEntry } {
  const projects: NavLinkEntry = { to: '/projects', label: 'Projects', icon: <FolderOutlined />, end: true }

  // Everyone sees the same screens; a member also gets "My tasks" on top.
  const mine: Entry[] = isManager ? [] : [{ kind: 'link', to: '/me/tasks', label: 'My tasks', icon: <ChecklistOutlined /> }]
  if (!projectId) return { main: [...mine, { kind: 'link', ...projects }] }

  const base = `/p/${projectId}`
  return {
    main: [
      ...mine,
      { kind: 'link', to: base, label: 'Overview', icon: <HomeOutlined />, end: true },
      {
        kind: 'group',
        id: 'boards',
        label: 'Boards',
        icon: tinted(<ViewKanbanOutlined />, tokens.color.stDone),
        items: [
          { to: `${base}/work-items`, label: 'Work items', icon: <FormatListBulletedRounded /> },
          { to: `${base}/board`, label: 'Sprint board', icon: <ViewKanbanOutlined /> },
          { to: `${base}/backlog`, label: 'Backlog', icon: <Inventory2Outlined /> },
          { to: `${base}/planning`, label: 'Sprint planning', icon: <CalendarMonthOutlined /> },
        ],
      },
      {
        kind: 'group',
        id: 'analytics',
        label: 'Analytics',
        icon: tinted(<InsightsOutlined />, tokens.color.stProgress),
        items: [
          { to: `${base}/dashboard`, label: 'Dashboard', icon: <DashboardOutlined /> },
          { to: `${base}/reports`, label: 'Reports', icon: <BarChartOutlined /> },
        ],
      },
      { kind: 'link', to: `${base}/team`, label: 'Team', icon: <GroupsOutlined /> },
    ],
    settings: { to: `${base}/settings`, label: 'Project settings', icon: <TuneOutlined /> },
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
  const { main, settings } = navigationFor(isManager, projectId)

  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={{
        bgcolor: tokens.color.sidebar,
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        px: collapsed ? 0.75 : 1.5,
        py: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        overflowX: 'hidden',
        overflowY: 'auto',
        borderRight: `1px solid ${tokens.color.border}`,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: collapsed ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 0.5, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: collapsed ? 0 : 0.5, minWidth: 0 }}>
          <Box aria-hidden sx={{ width: 24, height: 24, borderRadius: `${tokens.radius.control}px`, border: `1px solid ${tokens.color.borderStrong}`, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
            <ViewKanbanOutlined sx={{ fontSize: 14 }} />
          </Box>
          {!collapsed && (
            <Typography noWrap sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
              Sprint Manager
            </Typography>
          )}
        </Box>
        {collapsible && <CollapseToggle collapsed={collapsed} onToggle={nav.toggleCollapsed} />}
      </Box>

      {projectId && <ProjectHeader projectId={projectId} collapsed={collapsed} onNavigate={onNavigate} />}
      {projectId && <SearchButton projectId={projectId} collapsed={collapsed} onNavigate={onNavigate} />}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', pt: 1 }}>
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
              onOpen={() => nav.openGroup(entry.id)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ),
        )}
      </Box>

      <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1, pt: 2 }}>
        {settings && <NavItem {...settings} collapsed={collapsed} onNavigate={onNavigate} />}
        {projectId && !collapsed && <SprintCard projectId={projectId} onNavigate={onNavigate} />}
        <UserMenu onNavigate={onNavigate} collapsed={collapsed} />
      </Box>
    </Box>
  )
}
