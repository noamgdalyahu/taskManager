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
import { useState } from 'react'
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
  collapsed: boolean
  onNavigate?: () => void
}

/**
 * An expandable section like "Boards" in Azure DevOps. Wide: a header with a chevron that folds its pages in and out.
 * Icon rail: the header is an icon, and pressing it opens the pages as a flyout beside the rail.
 */
export function NavGroup({ id, label, icon, items, expanded, onToggle, collapsed, onNavigate }: NavGroupProps) {
  const { pathname } = useLocation()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const active = items.some((item) => matchPath({ path: item.to, end: item.end ?? false }, pathname))

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
              position: 'relative',
              minHeight: 44,
              justifyContent: 'center',
              borderRadius: `${tokens.radius.control}px`,
              color: active ? 'primary.dark' : 'text.primary',
              bgcolor: active ? 'primary.light' : 'transparent',
              '& svg': { fontSize: 20 },
              '&:hover': { bgcolor: active ? 'primary.light' : tokens.color.track },
              '&:focus-visible': { outline: `2px solid ${tokens.color.primary}`, outlineOffset: -2 },
              '&::before': active ? { content: '""', position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, bgcolor: 'primary.main' } : undefined,
            }}
          >
            {icon}
          </ButtonBase>
        </Tooltip>
        {/* The flyout opens from the icon that was pressed, to its right (apple-design: anchor to the source). */}
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { sx: { ml: 1, minWidth: 190 } } }}>
          <Box sx={{ px: 2, py: 0.75, color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</Box>
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
              <ListItemIcon sx={{ minWidth: 34, '& svg': { fontSize: 20 } }}>{item.icon}</ListItemIcon>
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
          gap: 1.5,
          minHeight: 44,
          px: 1.5,
          borderRadius: `${tokens.radius.control}px`,
          color: 'text.primary',
          fontSize: '0.875rem',
          fontWeight: active ? 700 : 600,
          textAlign: 'left',
          '& > svg:first-of-type': { fontSize: 20 },
          '&:hover': { bgcolor: tokens.color.track },
          '&:focus-visible': { outline: `2px solid ${tokens.color.primary}`, outlineOffset: -2 },
        }}
      >
        {icon}
        <Box component="span" sx={{ flex: 1 }}>
          {label}
        </Box>
        <ExpandMoreRounded sx={{ fontSize: 20, color: 'text.secondary', transform: expanded ? 'none' : 'rotate(-90deg)', transition: 'transform 180ms ease-out' }} />
      </ButtonBase>
      <Collapse in={expanded} id={`nav-group-${id}`} unmountOnExit={false}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, pt: 0.25 }}>
          {items.map((item) => (
            <NavItem key={item.to} {...item} nested onNavigate={onNavigate} />
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}
