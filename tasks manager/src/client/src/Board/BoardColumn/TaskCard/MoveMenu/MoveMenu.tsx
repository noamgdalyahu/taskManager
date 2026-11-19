import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded'
import IconButton from '@mui/material/IconButton'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useState } from 'react'
import { STATUS_LABEL, TASK_STATUSES, type TaskStatus } from '@/api/types'

interface MoveMenuProps {
  taskTitle: string
  current: TaskStatus
  onMove: (status: TaskStatus) => void
}

/**
 * Dragging is the fast way to move a card, never the only way (agency, familiarity): this menu does the same job with a
 * keyboard, a screen reader, or a thumb on a phone. It opens from the button that was pressed.
 */
export function MoveMenu({ taskTitle, current, onMove }: MoveMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  return (
    <>
      <IconButton
        size="small"
        aria-label={`Move "${taskTitle}" to another column`}
        aria-haspopup="menu"
        onClick={(event) => setAnchor(event.currentTarget)}
        // Pressing the button must not start a drag of the card underneath it.
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        sx={{ color: 'text.secondary', width: 32, height: 32 }}
      >
        <MoreHorizRounded fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} transformOrigin={{ vertical: 'top', horizontal: 'right' }} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {TASK_STATUSES.filter((status) => status !== current).map((status) => (
          <MenuItem
            key={status}
            onClick={() => {
              setAnchor(null)
              onMove(status)
            }}
          >
            <ListItemText>Move to {STATUS_LABEL[status]}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
