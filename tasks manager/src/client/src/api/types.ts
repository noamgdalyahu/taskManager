import type { components } from './schema'

// Friendly names for the generated contract. The shapes come from the C# server (npm run api:types); nothing here is
// hand-written except the few places where OpenAPI cannot express nullability of an object reference.
type S = components['schemas']

export type Role = S['UserRole']
export type TaskStatus = S['WorkItemStatus']
export type SprintStatus = S['SprintStatus']
export type TaskType = NonNullable<S['NullableOfTaskType']>

export type UserDto = S['UserDto']
export type AuthResponse = S['AuthResponse']
export type ProjectDto = S['ProjectDto']
export type TeamMemberDto = S['TeamMemberDto']
export type InvitationDto = S['InvitationDto']
export type SprintDto = S['SprintDto']
export type TaskDto = S['TaskDto']
export type TaskDetailDto = S['TaskDetailDto']
export type CommentDto = S['CommentDto']
export type TimeLogDto = S['TimeLogDto']
export type HistoryDto = S['HistoryDto']
export type BoardDto = S['BoardDto']
export type BoardColumnDto = S['BoardColumnDto']
export type MyTaskDto = S['MyTaskDto']
export type BurndownPointDto = S['BurndownPointDto']
/**
 * Known generator quirk: Microsoft.AspNetCore.OpenApi 9.0.6 emits `items: {}` for the 2nd and 3rd list of the same element
 * type inside one schema, so `actual` and `forecast` arrive as `unknown[]` although the C# type is identical to `ideal`.
 * Restated here with the real type. Remove the override when the server's OpenAPI document describes them correctly.
 */
export type DashboardDto = Omit<S['DashboardDto'], 'actual' | 'forecast'> & { actual: BurndownPointDto[]; forecast: BurndownPointDto[] }
export type MemberWorkloadDto = S['MemberWorkloadDto']
export type AtRiskTaskDto = S['AtRiskTaskDto']
export type ReportsDto = S['ReportsDto']
export type SprintReportDto = S['SprintReportDto']
export type MemberReportDto = S['MemberReportDto']
export type PlannedTaskDto = S['PlannedTaskDto']
export type PlanWarningDto = S['PlanWarningDto']
export type SprintPlanDto = S['SprintPlanDto']
export type PlanComparisonDto = S['PlanComparisonDto']
export type StrategyScoreDto = S['StrategyScoreDto']
export type PlanJobStatus = S['PlanJobStatus']

/** A planning job. `result` is only present once the job is Done (OpenAPI cannot mark an object reference nullable). */
export type PlanJobDto = Omit<S['PlanJobDto'], 'result'> & { result: SprintPlanDto | null }

export type CreateTaskRequest = S['CreateTaskRequest']
export type UpdateTaskRequest = S['UpdateTaskRequest']
export type SprintRequest = S['SprintRequest']
export type ProjectRequest = S['ProjectRequest']
export type UpdateProfileRequest = S['UpdateProfileRequest']

export const TASK_STATUSES = ['ToDo', 'InProgress', 'InQA', 'Done'] as const satisfies readonly TaskStatus[]

/** What the user reads for each status. Specific labels beat generic ones. */
export const STATUS_LABEL: Record<TaskStatus, string> = {
  ToDo: 'To do',
  InProgress: 'In progress',
  InQA: 'In QA',
  Done: 'Done',
}

/** The kinds of work, in the order they are offered. */
export const TASK_TYPES = ['Bug', 'UserStory', 'Task', 'Epic', 'Feature', 'Issue', 'TestCase', 'Ticket'] as const satisfies readonly TaskType[]

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  Bug: 'Bug',
  UserStory: 'User Story',
  Task: 'Task',
  Epic: 'Epic',
  Feature: 'Feature',
  Issue: 'Issue',
  TestCase: 'Test Case',
  Ticket: 'Ticket',
}

/** What each type is for, shown as help text where a type is chosen. */
export const TASK_TYPE_PURPOSE: Record<TaskType, string> = {
  Bug: 'Something is broken and needs fixing',
  UserStory: 'A requirement describing something a user wants',
  Task: 'A specific piece of work to complete',
  Epic: 'A large initiative containing multiple work items',
  Feature: 'A new capability or functionality',
  Issue: 'A problem, concern, or item requiring investigation',
  TestCase: 'A defined scenario to verify functionality',
  Ticket: 'A general work request or support item',
}
