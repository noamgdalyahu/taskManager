import Typography from '@mui/material/Typography'
import { Surface } from '@/common/Surface/Surface'
import { tokens } from '@/theme/tokens'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  /** `warn` colours the value when the number is bad news (for example a forecast past the sprint end). */
  tone?: 'default' | 'warn'
}

export function StatCard({ label, value, hint, tone = 'default' }: StatCardProps) {
  return (
    <Surface sx={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        component="div"
        sx={{
          fontFamily: tokens.font.mono,
          fontSize: '1.875rem',
          fontWeight: 400,
          lineHeight: 1.15,
          color: tone === 'warn' ? tokens.color.warnText : 'text.primary',
        }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography variant="body2" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Surface>
  )
}
