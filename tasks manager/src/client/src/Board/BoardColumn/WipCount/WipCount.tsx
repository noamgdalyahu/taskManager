import Typography from '@mui/material/Typography'
import { tokens } from '@/theme/tokens'

interface WipCountProps {
  count: number
  /** The column's work-in-progress limit, if it has one. */
  limit?: number
}

/**
 * The number at the right of a column header, as in Azure Boards. With a limit it reads "5/5": green when the column is
 * exactly full, red and bold once it is over. Colour is never the only signal: the over-limit case also says so in words
 * for screen readers and in a tooltip-style title.
 */
export function WipCount({ count, limit }: WipCountProps) {
  if (limit === undefined) {
    return (
      <Typography variant="body2" color="text.secondary">
        {count}
      </Typography>
    )
  }

  const over = count > limit
  const atLimit = count === limit
  const spoken = `${count} of ${limit}${over ? `, over the limit by ${count - limit}` : atLimit ? ', at the limit' : ''}`

  return (
    <Typography
      variant="body2"
      title={over ? 'Over the work in progress limit' : atLimit ? 'At the work in progress limit' : 'Work in progress limit'}
      aria-label={spoken}
      sx={{ fontWeight: over || atLimit ? 700 : 500, color: over ? tokens.color.danger : atLimit ? tokens.color.success : 'text.secondary' }}
    >
      {count}/{limit}
    </Typography>
  )
}
