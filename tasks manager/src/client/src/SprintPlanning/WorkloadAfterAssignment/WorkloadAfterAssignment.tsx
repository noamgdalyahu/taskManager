import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { SprintDto, SprintPlanDto, TeamMemberDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { WorkloadRow } from '@/common/WorkloadRow/WorkloadRow'
import { memberCapacityHours } from '@/hooks/useCapacity'

interface WorkloadAfterAssignmentProps {
  plan: SprintPlanDto | null
  members: TeamMemberDto[]
  sprint: SprintDto
}

/** How full each person is if the suggestion is accepted, against what they can actually carry in this sprint. */
export function WorkloadAfterAssignment({ plan, members, sprint }: WorkloadAfterAssignmentProps) {
  const loadOf = (memberId: string) => plan?.loads.find((load) => load.memberId === memberId)?.hours ?? 0

  return (
    <Surface sx={{ flex: '1 1 260px' }}>
      <Typography variant="h2" component="h2" sx={{ mb: 1.75 }}>
        Workload after assignment
      </Typography>
      {!plan ? (
        <Typography color="text.secondary">Shown once a plan has been suggested.</Typography>
      ) : (
        <Stack spacing={1.75}>
          {members.map((member) => (
            <WorkloadRow key={member.id} memberId={member.id} name={member.name} value={loadOf(member.id)} total={memberCapacityHours(member, sprint)} />
          ))}
        </Stack>
      )}
    </Surface>
  )
}
