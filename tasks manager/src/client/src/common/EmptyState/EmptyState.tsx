import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { Surface } from '@/common/Surface/Surface'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

/** An empty screen is a decision point, not a dead end: say what is missing and offer the way forward. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Surface padding={5} sx={{ textAlign: 'center' }}>
      <Typography variant="h2" component="h2">
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 440, mx: 'auto' }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'center' }}>{action}</Box>}
    </Surface>
  )
}
