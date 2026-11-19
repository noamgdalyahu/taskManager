import MenuRounded from '@mui/icons-material/MenuRounded'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { material } from '@/theme/material'
import { tokens } from '@/theme/tokens'

/**
 * Phone-width navigation: a translucent bar that floats over the content as it scrolls underneath (apple-design,
 * section 12), instead of an opaque strip that permanently costs screen height.
 */
export function MobileTopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <Box
      component="header"
      sx={[
        material(0.72),
        {
          position: 'sticky',
          top: 0,
          zIndex: 'appBar',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          height: 56,
          px: 1,
          borderBottom: `1px solid ${tokens.color.border}`,
        },
      ]}
    >
      <IconButton aria-label="Open menu" onClick={onMenu}>
        <MenuRounded />
      </IconButton>
      <Typography sx={{ fontWeight: 700, letterSpacing: '-0.011em' }}>Team Sprint Manager</Typography>
    </Box>
  )
}
