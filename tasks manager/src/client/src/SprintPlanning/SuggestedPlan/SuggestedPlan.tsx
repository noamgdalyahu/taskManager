import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useAssignTask } from '@/api/tasks'
import type { PlanJobDto, TeamMemberDto } from '@/api/types'
import { SkeletonBlock } from '@/common/PageLoading/SkeletonBlock/SkeletonBlock'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { Surface } from '@/common/Surface/Surface'
import { PLAN_GRID, PlanRow } from '@/SprintPlanning/SuggestedPlan/PlanRow/PlanRow'

interface SuggestedPlanProps {
  job: PlanJobDto | undefined
  starting: boolean
  members: TeamMemberDto[]
  accepting: boolean
  /** Planning is only offered to managers, and only before the sprint starts. */
  planning: 'open' | 'started' | 'managers'
  onAccept: () => void
}

const headCell = { color: 'text.secondary', fontWeight: 600, py: 0.75, borderBottom: 1, borderColor: 'divider' }

export function SuggestedPlan({ job, starting, members, accepting, planning, onAccept }: SuggestedPlanProps) {
  const assign = useAssignTask()
  // What the manager has chosen by hand in this session wins over the suggestion shown in the row.
  const [overrides, setOverrides] = useState<Record<string, string | null>>({})
  const plan = job?.status === 'Done' ? job.result : null

  const running = starting || job?.status === 'Queued' || job?.status === 'Running'

  return (
    <Surface>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        <Typography variant="h2" component="h2">
          Suggested plan and assignment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ordered by dependencies. Accept it or change any row.
        </Typography>
      </Box>

      {!job && !starting && (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {planning === 'open' && <>Choose the tasks for this sprint, then press <strong>Suggest plan</strong>. The calculation runs in the background and takes a moment.</>}
          {planning === 'started' && 'This sprint has already started, so it can no longer be planned'}
          {planning === 'managers' && 'Managers plan the sprint. You can see the tasks that are in it on the left.'}
        </Typography>
      )}

      {running && (
        <Box role="status" aria-busy="true" sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Typography color="text.secondary" sx={{ pb: 0.5 }}>
            {job?.status === 'Running' ? 'Calculating the best assignment…' : 'Waiting for a free worker…'}
          </Typography>
          {[0, 1, 2, 3, 4].map((row) => (
            <SkeletonBlock key={row} height={36} radius={4} />
          ))}
        </Box>
      )}

      {job?.status === 'Failed' && <ErrorState error={new Error(job.error ?? 'The plan could not be calculated')} />}

      {plan && plan.tasks.length === 0 && <Typography sx={{ py: 3 }} color="text.secondary">There are no open tasks in this sprint to plan</Typography>}

      {plan && plan.tasks.length > 0 && (
        <>
          {assign.error && <ErrorState error={assign.error} />}
          <Box sx={{ display: 'grid', gridTemplateColumns: PLAN_GRID, columnGap: 1.5, alignItems: 'center', fontSize: '0.8125rem' }}>
            {/* The header row only makes sense in the wide layout; on a phone each row labels itself. */}
            <Box sx={{ display: { xs: 'none', md: 'contents' } }}>
              <Box sx={headCell}>#</Box>
              <Box sx={headCell}>Task</Box>
              <Box sx={headCell}>Assignee</Box>
              <Box sx={headCell}>Why this assignment</Box>
              <Box sx={{ ...headCell, textAlign: 'right' }}>Est.</Box>
            </Box>
            {plan.tasks.map((row) => (
              <PlanRow
                key={row.taskId}
                row={row}
                members={members}
                assigneeId={row.taskId in overrides ? overrides[row.taskId] : row.suggestedAssigneeId}
                onAssign={(memberId) => {
                  setOverrides((current) => ({ ...current, [row.taskId]: memberId }))
                  assign.mutate({ taskId: row.taskId, assigneeId: memberId })
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Accepting saves the suggested assignees. Rows you changed by hand are kept.
            </Typography>
            <Button variant="contained" onClick={onAccept} disabled={accepting || !plan.isFeasible}>
              {accepting ? 'Saving…' : 'Accept plan'}
            </Button>
          </Box>
        </>
      )}
    </Surface>
  )
}
