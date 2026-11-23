import Box from '@mui/material/Box'
import type { ReactNode } from 'react'
import { tokens } from '@/theme/tokens'

interface SettingsSectionProps {
  id: string
  title: string
  description?: string
  /** A danger section gets a red hairline. */
  danger?: boolean
  children: ReactNode
}

/** One bordered section of the settings page. */
export function SettingsSection({ id, title, description, danger = false, children }: SettingsSectionProps) {
  return (
    <Box component="section" aria-labelledby={`${id}-heading`} sx={{ border: `1px solid ${danger ? tokens.color.danger : tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, bgcolor: tokens.color.surface, p: 2 }}>
      <Box component="h2" id={`${id}-heading`} sx={{ m: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
        {title}
      </Box>
      {description && <Box sx={{ mt: 0.5, fontSize: '0.8125rem', color: tokens.color.muted }}>{description}</Box>}
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Box>
  )
}
