import Box from '@mui/material/Box'
import { useBoard } from '@/api/insight'
import { useSprint } from '@/api/sprints'
import { useMyTasks } from '@/api/tasks'
import { useCurrentUser } from '@/auth/useAuth'
import { EmptyState } from '@/common/EmptyState/EmptyState'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { LogTimeForm } from '@/MyTasks/LogTimeForm/LogTimeForm'
import { MySprintPanel } from '@/MyTasks/MySprintPanel/MySprintPanel'
import { PriorityList } from '@/MyTasks/PriorityList/PriorityList'

export function MyTasks() {
  const user = useCurrentUser()
  const tasks = useMyTasks()
  const items = tasks.data ?? []
  const sprintId = items[0]?.task.sprintId ?? undefined
  const sprint = useSprint(sprintId)
  const board = useBoard(sprintId)

  if (tasks.isLoading) return <PageLoading shape="detail" />
  if (tasks.error) return <ErrorState error={tasks.error} onRetry={() => tasks.refetch()} />

  // The sprint panel is computed from the board: everything assigned to me in this sprint, finished or not.
  const mine = (board.data?.columns.flatMap((column) => column.tasks) ?? []).filter((task) => task.assigneeId === user.id)
  const assigned = mine.reduce((sum, task) => sum + task.estimateHours, 0)
  const completed = mine.filter((task) => task.status === 'Done').reduce((sum, task) => sum + task.estimateHours, 0)
  const capacity = sprint.data ? (user.weeklyCapacityHours / 5) * sprint.data.workingDays : 0

  return (
    <>
      <PageHeader
        eyebrow={sprint.data?.name ?? 'My work'}
        title="My tasks"
        subtitle="Sorted by priority: due date, critical path, and how many tasks each one blocks"
      />
      {items.length === 0 ? (
        <EmptyState title="Nothing is assigned to you right now" description="When your manager assigns you work in a sprint, it appears here in the order you should do it." />
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'flex-start' }}>
          <PriorityList items={items} />
          <Box sx={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <MySprintPanel completedHours={completed} assignedHours={assigned} capacityHours={capacity} />
            <LogTimeForm items={items} />
          </Box>
        </Box>
      )}
    </>
  )
}
