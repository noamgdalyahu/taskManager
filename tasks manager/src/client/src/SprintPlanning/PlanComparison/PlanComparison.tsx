import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { usePlanComparison } from '@/api/planning'
import type { StrategyScoreDto } from '@/api/types'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { Surface } from '@/common/Surface/Surface'
import { comparisonSummary } from '@/lib/compare'
import { tokens } from '@/theme/tokens'

// The first column gets the room: its label plus the "Best" chip must stay on one line.
const COLUMNS = 'minmax(190px, 2fr) 0.7fr 1fr 1fr 1.1fr 0.8fr'

const head = { color: 'text.secondary', fontWeight: 600, py: 0.75, borderBottom: 1, borderColor: 'divider', fontSize: '0.8125rem' }
const cell = { py: 1.1, borderBottom: 1, borderColor: 'divider', fontSize: '0.875rem' }

const LABEL: Record<string, string> = {
  Manual: 'Your assignment',
  Greedy: 'Greedy baseline',
  Hungarian: 'Hungarian',
}

function Row({ score, best }: { score: StrategyScoreDto; best: boolean }) {
  return (
    <>
      <Box sx={{ ...cell, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        {LABEL[score.name] ?? score.name}
        {best && <Chip size="small" label="Best" sx={{ bgcolor: tokens.color.tealBg, color: tokens.color.tealText, height: 22 }} />}
      </Box>
      <Box sx={cell}>{score.objective.toFixed(2)}</Box>
      <Box sx={cell}>{(score.loadImbalance * 100).toFixed(1)}%</Box>
      <Box sx={{ ...cell, color: score.unassigned ? tokens.color.warnText : 'inherit' }}>{score.unassigned}</Box>
      <Box sx={{ ...cell, color: score.skillMismatches ? tokens.color.warnText : 'inherit' }}>{score.skillMismatches}</Box>
      <Box sx={{ ...cell, color: 'text.secondary' }}>{score.milliseconds} ms</Box>
    </>
  )
}

/** Measures the optimiser against the manager's own assignment and the greedy baseline, on the same tasks and the same cost function. */
export function PlanComparison({ sprintId }: { sprintId: string }) {
  const [open, setOpen] = useState(false)
  const comparison = usePlanComparison(sprintId, open)
  const data = comparison.data

  return (
    <Surface>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h2" component="h2">
            Compare with manual assignment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scores your current assignment, a greedy baseline and the optimiser on the same open tasks.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => (open ? comparison.refetch() : setOpen(true))} disabled={comparison.isFetching}>
          {open ? 'Recalculate' : 'Compare'}
        </Button>
      </Box>

      {comparison.error && <Box sx={{ mt: 2 }}><ErrorState error={comparison.error} /></Box>}

      {data && !data.isComparable && <Alert severity="warning" sx={{ mt: 2 }}>{data.message}</Alert>}

      {data?.isComparable && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: COLUMNS, columnGap: 1.5, minWidth: 620 }}>
              <Box sx={head}>Approach</Box>
              <Box sx={head}>Score</Box>
              <Box sx={head}>Load imbalance</Box>
              <Box sx={head}>Unassigned</Box>
              <Box sx={head}>Skill mismatches</Box>
              <Box sx={head}>Time</Box>
              {data.scores.map((score) => (
                <Row key={score.name} score={score} best={data.winners.includes(score.name)} />
              ))}
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {data.winners.length > 1
              ? `Tie: ${data.winners.map((w) => LABEL[w] ?? w).join(' and ')} reach the same score.`
              : `${LABEL[data.winner ?? ''] ?? data.winner} gives the best result.`}{' '}
            {comparisonSummary(data.scores) ?? ''} Lower score is better. Load imbalance is how unevenly people are loaded relative to their capacity.
          </Typography>
        </Box>
      )}
    </Surface>
  )
}
