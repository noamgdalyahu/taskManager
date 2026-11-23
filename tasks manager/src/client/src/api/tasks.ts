import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './http'
import { keys } from './queryKeys'
import type { BoardDto, CommentDto, CreateTaskRequest, MyTaskDto, TaskDetailDto, TaskDto, TaskStatus, TimeLogDto, UpdateTaskRequest } from './types'

export function useProjectTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: keys.tasks(projectId ?? ''),
    queryFn: ({ signal }) => http<TaskDto[]>(`/projects/${projectId}/tasks`, { signal }),
    enabled: !!projectId,
  })
}

export function useTaskDetail(taskId: string | undefined) {
  return useQuery({
    queryKey: keys.task(taskId ?? ''),
    queryFn: ({ signal }) => http<TaskDetailDto>(`/tasks/${taskId}`, { signal }),
    enabled: !!taskId,
  })
}

export function useMyTasks() {
  return useQuery({
    queryKey: keys.myTasks,
    queryFn: ({ signal }) => http<MyTaskDto[]>('/me/tasks', { signal }),
  })
}

/** Task changes ripple into boards, dashboards, priorities and plans, so every active query is refreshed. */
function useRefreshEverything() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries()
}

export function useCreateTask(projectId: string) {
  const refresh = useRefreshEverything()
  return useMutation({
    mutationFn: (body: CreateTaskRequest) => http<TaskDto>(`/projects/${projectId}/tasks`, { method: 'POST', body }),
    onSuccess: refresh,
  })
}

export function useUpdateTask() {
  const refresh = useRefreshEverything()
  return useMutation({
    mutationFn: (input: { taskId: string; body: UpdateTaskRequest }) =>
      http<TaskDto>(`/tasks/${input.taskId}`, { method: 'PUT', body: input.body }),
    onSuccess: refresh,
  })
}

/** Deletes a task with its comments, time logs and history (managers). The deleted task's own detail query is left alone, so a page showing it does not refetch a 404. */
export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => http<void>(`/tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: (_result, taskId) => qc.invalidateQueries({ predicate: (query) => !(query.queryKey[0] === 'tasks' && query.queryKey[1] === taskId) }),
  })
}

export function useAssignTask() {
  const refresh = useRefreshEverything()
  return useMutation({
    mutationFn: (input: { taskId: string; assigneeId: string | null }) =>
      http<TaskDto>(`/tasks/${input.taskId}/assignee`, { method: 'PUT', body: { assigneeId: input.assigneeId } }),
    onSuccess: refresh,
  })
}

/**
 * Status change with an optimistic board update (apple-design: feedback never waits for the network). The card moves
 * at once; if the server refuses (for example "Waiting for: Schema") the board snaps back and the error is shown.
 */
export function useChangeStatus(sprintId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { taskId: string; status: TaskStatus }) =>
      http<TaskDto>(`/tasks/${input.taskId}/status`, { method: 'PATCH', body: { status: input.status } }),
    onMutate: async ({ taskId, status }) => {
      if (!sprintId) return { previous: undefined }
      await qc.cancelQueries({ queryKey: keys.board(sprintId) })
      const previous = qc.getQueryData<BoardDto>(keys.board(sprintId))
      if (previous) qc.setQueryData<BoardDto>(keys.board(sprintId), moveCard(previous, taskId, status))
      return { previous }
    },
    onError: (_error, _input, context) => {
      if (sprintId && context?.previous) qc.setQueryData(keys.board(sprintId), context.previous)
    },
    onSettled: () => qc.invalidateQueries(),
  })
}

function moveCard(board: BoardDto, taskId: string, status: TaskStatus): BoardDto {
  const card = board.columns.flatMap((c) => c.tasks).find((t) => t.id === taskId)
  if (!card) return board
  const moved = { ...card, status }
  return {
    ...board,
    columns: board.columns.map((column) => {
      const without = column.tasks.filter((t) => t.id !== taskId)
      return column.status === status ? { ...column, tasks: [...without, moved] } : { ...column, tasks: without }
    }),
  }
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => http<CommentDto>(`/tasks/${taskId}/comments`, { method: 'POST', body: { text } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.task(taskId) }),
  })
}

export function useLogTime() {
  const refresh = useRefreshEverything()
  return useMutation({
    mutationFn: (input: { taskId: string; hours: number; note?: string }) =>
      http<TimeLogDto>(`/tasks/${input.taskId}/time`, { method: 'POST', body: { hours: input.hours, note: input.note } }),
    onSuccess: refresh,
  })
}
