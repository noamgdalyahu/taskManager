import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Surface } from '@/common/Surface/Surface'
import { WorkloadRow } from '@/common/WorkloadRow/WorkloadRow'

interface WorkloadPanelProps {
  title: string
  rows: { memberId: string; name: string; value: number; total: number }[]
}

/** A titled list of per-person bars. The dashboard uses it twice: planned against capacity, and finished against planned. */
export function WorkloadPanel({ title, rows }: WorkloadPanelProps) {
  return (
    <Surface>
      <Typography variant="h2" component="h2" sx={{ mb: 1.75 }}>
        {title}
      </Typography>
      <Stack spacing={1.75}>
        {rows.map((row) => (
          <WorkloadRow key={row.memberId} {...row} />
        ))}
      </Stack>
    </Surface>
  )
}
