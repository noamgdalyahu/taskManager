import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined'
import Box from '@mui/material/Box'
import type { ReactNode } from 'react'
import { HairlineButton } from '@/common/HairlineButton/HairlineButton'
import { tokens } from '@/theme/tokens'

interface ReportToolbarProps {
  title: string
  description: string
  /** The range selector (sprints or dates). */
  children: ReactNode
  onExport: () => void
  canExport: boolean
}

/** The top of a full report: what it shows, the range to show it for, and the CSV export. */
export function ReportToolbar({ title, description, children, onExport, canExport }: ReportToolbarProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <Box sx={{ minWidth: 0 }}>
        <Box component="h2" sx={{ m: 0, fontSize: '1.0625rem', fontWeight: 600 }}>
          {title}
        </Box>
        <Box sx={{ mt: 0.25, fontSize: '0.8125rem', color: tokens.color.muted, maxWidth: 640 }}>{description}</Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        {children}
        <HairlineButton onClick={onExport} disabled={!canExport} aria-label={`Export ${title} as CSV`}>
          <FileDownloadOutlined aria-hidden />
          Export CSV
        </HairlineButton>
      </Box>
    </Box>
  )
}
