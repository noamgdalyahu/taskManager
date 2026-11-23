import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Collapse from '@mui/material/Collapse'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, matchPath, useLocation } from 'react-router-dom'
import { NavItem, type NavLinkEntry } from '@/common/AppShell/Sidebar/NavItem/NavItem'
import { tokens } from '@/theme/tokens'

interface NavGroupProps {
  id: string
  label: string
  icon: ReactNode
  items: NavLinkEntry[]
  expanded: boolean
  onToggle: () => void
  /** Opens the group without toggling it. */
  onOpen: () => void
  collapsed: boolean
  onNavigate?: () => void
}

/**
 * An expandable section such as "Boards". Wide: a header with a chevron, and its pages indented under a 1px left rule.
 * Icon rail: the header is an icon, and pressing it opens the pages as a flyout beside the rail.
 */
export function NavGroup({ id, label, icon, items, expanded, onToggle, onOpen, collapsed, onNavigate }: NavGroupProps) {
  const { pathname } = useLocation()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const active = items.some((item) => matchPath({ path: item.to, end: item.end ?? false }, pathname))

  // Arriving on a page inside a collapsed group opens the group, so the current page is never hidden.
  useEffect(() => {
    if (active && !expanded && !collapsed) onOpen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (collapsed) {
    return (
      <>
        <Tooltip title={label} placement="right">
          <ButtonBase
            onClick={(event) => setAnchor(event.currentTarget)}
            aria-label={label}
            aria-haspopup="menu"
            aria-expanded={!!anchor}
            sx={{
              minHeight: 34,
              justifyContent: 'center',
              borderRadius: `${tokens.radius.control}px`,
              border: `1px solid ${active ? tokens.color.borderStrong : 'transparent'}`,
              color: tokens.color.text,
              bgcolor: active ? tokens.color.wash : 'transparent',
              '& svg': { fontSize: 16 },
              '&:hover': { bgcolor: tokens.color.wash },
            }}
          >
            {icon}
          </ButtonBase>
        </Tooltip>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { sx: { ml: 1, minWidth: 190 } } }}>
          <Box sx={{ px: 2, py: 0.75, color: tokens.color.faint, fontSize: '0.75rem', fontWeight: 500 }}>{label}</Box>
          {items.map((item) => (
            <MenuItem
              key={item.to}
              component={Link}
              to={item.to}
              selected={!!matchPath({ path: item.to, end: item.end ?? false }, pathname)}
              onClick={() => {
                setAnchor(null)
                onNavigate?.()
              }}
            >
              <ListItemIcon sx={{ minWidth: 28, '& svg': { fontSize: 16 } }}>{item.icon}</ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </>
    )
  }

  return (
    <Box>
      <ButtonBase
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`nav-group-${id}`}
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 1.25,
          minHeight: 34,
          px: 1.25,
          borderRadius: `${tokens.radius.control}px`,
          border: '1px solid transparent',
          color: tokens.color.text,
          fontSize: '0.875rem',
          fontWeight: 600,
          textAlign: 'left',
          '& svg': { fontSize: 16 },
          '&:hover': { bgcolor: tokens.color.wash },
        }}
      >
        {icon}
        <Box component="span" sx={{ flex: 1 }}>
          {label}
        </Box>
        <ExpandMoreRounded aria-hidden sx={{ fontSize: 16, color: tokens.color.faint, transform: expanded ? 'none' : 'rotate(-90deg)', transition: 'transform 150ms ease-out' }} />
      </ButtonBase>
      <Collapse in={expanded} id={`nav-group-${id}`} unmountOnExit={false}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', pt: '2px', ml: '17px', pl: 1, borderLeft: `1px solid ${tokens.color.border}` }}>
          {items.map((item) => (
            <NavItem key={item.to} {...item} nested onNavigate={onNavigate} />
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}
