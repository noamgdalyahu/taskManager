import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { ProgressBar } from '@/common/ProgressBar/ProgressBar'
import { formatHours, percent } from '@/lib/format'

interface WorkloadRowProps {
  memberId: string
  name: string
  value: number
  total: number
}

/** One person's bar: avatar, name, fill and "32 / 40 h". Used by sprint planning and by the dashboard. */
export function WorkloadRow({ memberId, name, value, total }: WorkloadRowProps) {
  const label = `${name}: ${formatHours(value)} of ${formatHours(total)}`
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <MemberAvatar id={memberId} name={name} />
      <Typography sx={{ flex: '0 0 64px', fontWeight: 500 }} noWrap>
        {name}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ProgressBar value={percent(value, total)} label={label} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ flex: '0 0 84px', textAlign: 'right' }}>
        {Math.round(value * 10) / 10} / {Math.round(total * 10) / 10} h
      </Typography>
    </Box>
  )
}
