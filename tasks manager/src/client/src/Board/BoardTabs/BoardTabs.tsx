import Box from '@mui/material/Box'
import { tokens } from '@/theme/tokens'

/** The page's one view: the Taskboard. Backlog and Capacity have their own pages in the sidebar. */
export function BoardTabs() {
  return (
    <Box role="tablist" aria-label="Sprint views" sx={{ display: 'flex', borderBottom: `1px solid ${tokens.color.border}` }}>
      <Box
        role="tab"
        aria-selected
        tabIndex={0}
        sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 40, px: 1.5, mb: '-1px', fontSize: '0.8125rem', fontWeight: 500, color: tokens.color.text, borderBottom: `2px solid ${tokens.color.text}` }}
      >
        Taskboard
      </Box>
    </Box>
  )
}
