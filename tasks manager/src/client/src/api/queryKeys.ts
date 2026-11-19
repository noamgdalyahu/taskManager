/** Query keys in one place so invalidation never depends on a typo. Keys nest so a prefix invalidates a whole area. */
export const keys = {
  me: ['me'] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  team: (projectId: string) => ['projects', projectId, 'team'] as const,
  tasks: (projectId: string) => ['projects', projectId, 'tasks'] as const,
  sprints: (projectId: string) => ['projects', projectId, 'sprints'] as const,
  reports: (projectId: string) => ['projects', projectId, 'reports'] as const,
  sprint: (id: string) => ['sprints', id] as const,
  board: (sprintId: string) => ['sprints', sprintId, 'board'] as const,
  dashboard: (sprintId: string) => ['sprints', sprintId, 'dashboard'] as const,
  comparison: (sprintId: string) => ['sprints', sprintId, 'comparison'] as const,
  task: (id: string) => ['tasks', id] as const,
  myTasks: ['me', 'tasks'] as const,
  planJob: (id: string) => ['plan-jobs', id] as const,
}
