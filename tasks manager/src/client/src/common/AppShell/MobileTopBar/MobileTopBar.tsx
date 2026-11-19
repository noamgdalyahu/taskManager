import MenuRounded from '@mui/icons-material/MenuRounded'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'
import { tokens } from '@/theme/tokens'

/** Below 900px wide the sidebar is a drawer; this bar holds the button that opens it. */
export function MobileTopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <Box
      component="header"
      sx={{ position: 'sticky', top: 0, zIndex: 'appBar', display: 'flex', alignItems: 'center', gap: 1, height: 48, px: 1, bgcolor: tokens.color.canvas, borderBottom: `1px solid ${tokens.color.border}` }}
    >
      <ButtonBase
        onClick={onMenu}
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        sx={{ width: 36, height: 36, borderRadius: `${tokens.radius.control}px`, border: `1px solid ${tokens.color.border}`, '&:hover': { bgcolor: tokens.color.wash } }}
      >
        <MenuRounded aria-hidden sx={{ fontSize: 18 }} />
      </ButtonBase>
      <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Sprint Manager</Typography>
    </Box>
  )
}
