import ButtonBase from '@mui/material/ButtonBase'
import Tooltip from '@mui/material/Tooltip'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { tokens } from '@/theme/tokens'

export interface NavLinkEntry {
  to: string
  label: string
  icon: ReactNode
  /** Match the path exactly (a project's overview must not light up for every page below it). */
  end?: boolean
}

interface NavItemProps extends NavLinkEntry {
  onNavigate?: () => void
  /** Icon-only rail: the label moves into a tooltip. */
  collapsed?: boolean
  /** A child of a group: indented under its header. */
  nested?: boolean
}

export function NavItem({ to, label, icon, end, onNavigate, collapsed = false, nested = false }: NavItemProps) {
  const link = (
    <ButtonBase
      component={NavLink}
      to={to}
      end={end}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      sx={{
        position: 'relative',
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'flex-start',
        alignItems: 'center',
        gap: 1.5,
        minHeight: nested ? 40 : 44,
        px: collapsed ? 0 : 1.5,
        pl: !collapsed && nested ? 5 : undefined,
        borderRadius: `${tokens.radius.control}px`,
        color: 'text.primary',
        fontSize: '0.875rem',
        fontWeight: 500,
        textAlign: 'left',
        whiteSpace: 'nowrap',
        transition: 'transform 100ms ease-out, background-color 120ms ease-out',
        '& svg': { fontSize: 20, flex: '0 0 auto' },
        '&:hover': { bgcolor: tokens.color.track },
        '&:active': { transform: 'scale(0.98)' },
        '&:focus-visible': { outline: `2px solid ${tokens.color.primary}`, outlineOffset: -2 },
        // NavLink adds the `active` class (and aria-current) to the link that matches the URL. As in Azure DevOps the
        // current page also gets an accent bar on its left edge, so it stays findable without relying on colour alone.
        '&.active': { bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 600 },
        '&.active::before': { content: '""', position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, bgcolor: 'primary.main' },
      }}
    >
      {icon}
      {!collapsed && label}
    </ButtonBase>
  )

  return collapsed ? (
    <Tooltip title={label} placement="right">
      {link}
    </Tooltip>
  ) : (
    link
  )
}
