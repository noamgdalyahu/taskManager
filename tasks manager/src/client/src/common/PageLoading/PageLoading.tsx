import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export function PageLoading() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
      <CircularProgress size={28} aria-label="Loading" />
    </Box>
  )
}
