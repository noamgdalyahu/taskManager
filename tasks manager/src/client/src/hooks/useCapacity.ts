import type { SprintDto, TeamMemberDto } from '@/api/types'

/** A person's hours in a sprint: weekly capacity spread over a five-day week, times the sprint's working days (same rule as the server). */
export function memberCapacityHours(member: Pick<TeamMemberDto, 'weeklyCapacityHours'>, sprint: Pick<SprintDto, 'workingDays'>): number {
  return (member.weeklyCapacityHours / 5) * sprint.workingDays
}
