import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import type { PlanWarningDto } from '@/api/types'

/** Blocking problems (a dependency cycle) are errors; everything else is a warning the manager can still act on. */
export function PlanWarnings({ warnings }: { warnings: PlanWarningDto[] }) {
  if (warnings.length === 0) return null
  return (
    <Stack spacing={1}>
      {warnings.map((warning, index) => (
        <Alert key={index} severity={warning.isBlocking ? 'error' : 'warning'}>
          {warning.message}
        </Alert>
      ))}
    </Stack>
  )
}
