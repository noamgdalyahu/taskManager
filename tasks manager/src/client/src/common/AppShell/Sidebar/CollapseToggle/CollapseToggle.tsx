import KeyboardDoubleArrowLeftRounded from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import KeyboardDoubleArrowRightRounded from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import ButtonBase from '@mui/material/ButtonBase'
import Tooltip from '@mui/material/Tooltip'
import { tokens } from '@/theme/tokens'

interface CollapseToggleProps {
  collapsed: boolean
  onToggle: () => void
}

/** The « at the bottom of the navigation: folds it down to an icon rail and back, and remembers the choice. */
export function CollapseToggle({ collapsed, onToggle }: CollapseToggleProps) {
  const label = collapsed ? 'Expand the navigation' : 'Collapse the navigation'
  return (
    <Tooltip title={label} placement="right">
      <ButtonBase
        onClick={onToggle}
        aria-label={label}
        aria-expanded={!collapsed}
        sx={{
          flex: '0 0 auto',
          width: 28,
          height: 28,
          borderRadius: `${tokens.radius.control}px`,
          color: tokens.color.faint,
          '&:hover': { bgcolor: tokens.color.wash, color: tokens.color.text },
          '&:active': { transform: 'scale(0.92)' },
        }}
      >
        {collapsed ? <KeyboardDoubleArrowRightRounded fontSize="small" /> : <KeyboardDoubleArrowLeftRounded fontSize="small" />}
      </ButtonBase>
    </Tooltip>
  )
}
