import UnfoldMoreRounded from '@mui/icons-material/UnfoldMoreRounded'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import ListItemIcon from '@mui/material/ListItemIcon'
import Switch from '@mui/material/Switch'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import { setAppearance, useAppearance } from '@/theme/appearance'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { useCurrentUser, useAuth } from '@/auth/useAuth'
import { tokens } from '@/theme/tokens'

interface UserMenuProps {
  onNavigate?: () => void
  /** Icon rail: only the avatar is shown. */
  collapsed?: boolean
}

/** Who you are and how to leave, at the bottom of the navigation where Mac apps keep it. */
export function UserMenu({ onNavigate, collapsed = false }: UserMenuProps) {
  const user = useCurrentUser()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const appearance = useAppearance()

  const button = (
    <ButtonBase
      onClick={(event) => setAnchor(event.currentTarget)}
      aria-haspopup="menu"
      aria-expanded={!!anchor}
      aria-label={`${user.name}, ${user.role}. Account menu`}
      sx={{
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'flex-start',
        alignItems: 'center',
        gap: 1.25,
        px: collapsed ? 0 : 1,
        minHeight: 40,
        width: '100%',
        borderRadius: `${tokens.radius.control}px`,
        textAlign: 'left',
        '&:hover': { bgcolor: tokens.color.wash },
      }}
    >
      <MemberAvatar id={user.id} name={user.name} size={24} />
      {!collapsed && (
        <>
          <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: '0.8125rem', fontWeight: 500 }}>
            {user.name}
          </Typography>
          <UnfoldMoreRounded aria-hidden sx={{ fontSize: 16, color: tokens.color.faint }} />
        </>
      )}
    </ButtonBase>
  )

  return (
    <>
      {collapsed ? (
        <Tooltip title={user.name} placement="right">
          {button}
        </Tooltip>
      ) : (
        button
      )}
      {/* The menu grows out of the button that opened it, not out of the screen centre (apple-design, section 7). */}
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: collapsed ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 200, mb: 1 } } }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null)
            onNavigate?.()
            navigate('/profile')
          }}
        >
          <ListItemIcon>
            <PersonOutlineOutlined fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        {/* A switch, not a navigation: the menu stays open so the change is visible straight away. */}
        <MenuItem onClick={() => setAppearance(appearance === 'dark' ? 'light' : 'dark')}>
          <ListItemIcon>
            <DarkModeOutlined fontSize="small" />
          </ListItemIcon>
          <Box component="span" sx={{ flex: 1 }}>
            Dark mode
          </Box>
          <Switch edge="end" size="small" checked={appearance === 'dark'} tabIndex={-1} slotProps={{ input: { 'aria-label': 'Dark mode' } }} />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null)
            logout()
          }}
        >
          <ListItemIcon>
            <LogoutOutlined fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  )
}
