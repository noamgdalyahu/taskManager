import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  /** Where you are: "Atlas Platform / Sprint 4". Answers "where am I?" before anything else. */
  eyebrow?: ReactNode
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box component="header" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        {eyebrow && (
          <Typography component="div" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h1" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography component="div" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>{actions}</Box>}
    </Box>
  )
}
