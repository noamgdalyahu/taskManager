import CheckRounded from '@mui/icons-material/CheckRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import LayersOutlined from '@mui/icons-material/LayersOutlined'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useState } from 'react'
import { GROUPING_LABEL, type LaneGrouping } from '@/Board/boardLanes'
import { HairlineButton } from '@/common/HairlineButton/HairlineButton'
import { tokens } from '@/theme/tokens'

interface GroupByButtonProps {
  grouping: LaneGrouping
  onGrouping: (grouping: LaneGrouping) => void
}

/** How the swimlanes are formed: by type, by assignee, or not at all. Sits above the board, with the other board controls. */
export function GroupByButton({ grouping, onGrouping }: GroupByButtonProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  return (
    <>
      <HairlineButton onClick={(event) => setAnchor(event.currentTarget)} aria-haspopup="menu" aria-expanded={!!anchor} aria-label={`${GROUPING_LABEL[grouping]}. Change how the board is grouped`}>
        <LayersOutlined aria-hidden />
        {GROUPING_LABEL[grouping]}
        <ExpandMoreRounded aria-hidden sx={{ color: tokens.color.faint }} />
      </HairlineButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
        {(Object.keys(GROUPING_LABEL) as LaneGrouping[]).map((option) => (
          <MenuItem
            key={option}
            selected={option === grouping}
            onClick={() => {
              setAnchor(null)
              onGrouping(option)
            }}
          >
            <ListItemText>{GROUPING_LABEL[option]}</ListItemText>
            {option === grouping && <CheckRounded fontSize="small" sx={{ ml: 2 }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
