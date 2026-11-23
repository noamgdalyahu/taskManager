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
  /** A child of a group: it sits under the group's 1px rule, so it needs no extra indent of its own. */
  nested?: boolean
}

/** A navigation link. The current page has a stronger 1px border and the selected wash, never a coloured fill. */
export function NavItem({ to, label, icon, end, onNavigate, collapsed = false, nested = false }: NavItemProps) {
  const link = (
    <ButtonBase
      component={NavLink}
      to={to}
      end={end}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      sx={{
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'flex-start',
        alignItems: 'center',
        gap: 1.25,
        minHeight: 34,
        px: collapsed ? 0 : 1.25,
        borderRadius: `${tokens.radius.control}px`,
        border: '1px solid transparent',
        color: nested ? tokens.color.muted : tokens.color.text,
        // Top-level items are bold in the primary text colour; children are 13.5px and lighter.
        fontSize: nested ? '0.84375rem' : '0.875rem',
        fontWeight: nested ? 400 : 600,
        textAlign: 'left',
        whiteSpace: 'nowrap',
        '& svg': { fontSize: 16, flex: '0 0 auto', color: nested ? tokens.color.faint : 'inherit' },
        '&:hover': { bgcolor: tokens.color.wash },
        // NavLink adds the `active` class and aria-current="page" to the link that matches the URL.
        '&.active': { bgcolor: tokens.color.wash, borderColor: tokens.color.borderStrong, color: tokens.color.text, fontWeight: nested ? 500 : 600 },
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
