using SprintManager.Core.Assignment;
using SprintManager.Core.Domain;
using SprintManager.Core.Planning;

namespace SprintManager.Api.Controllers.SprintPlanning.Plans;

/// <summary>Explicit mappings from Core planning types to API contracts.</summary>
public static class PlanMapping
{
    /// <summary>Job to DTO.</summary>
    public static PlanJobDto ToDto(this PlanJob job) => new(
        job.Id.Value,
        job.SprintId.Value,
        job.StrategyName,
        job.Status,
        job.CreatedAt,
        job.StartedAt,
        job.FinishedAt,
        job.QueueTime?.TotalMilliseconds,
        job.RunTime?.TotalMilliseconds,
        job.Result?.ToDto(),
        job.Error);

    /// <summary>Comparison to DTO.</summary>
    public static PlanComparisonDto ToDto(this PlanComparison c) => new(
        c.IsComparable,
        c.Message,
        c.Winner?.Name,
        c.Winners.Select(w => w.Name).ToList(),
        c.Scores.Select(s => new StrategyScoreDto(
            s.Name, Math.Round(s.Objective, 3), Math.Round(s.SkillCost, 3), Math.Round(s.LoadImbalance, 4),
            s.Unassigned, s.SkillMismatches, s.OverCapacityMembers, Math.Round(s.Milliseconds, 2))).ToList());

    /// <summary>Plan to DTO.</summary>
    public static SprintPlanDto ToDto(this SprintPlan plan) => new(
        plan.IsFeasible,
        plan.Tasks.Select(ToDto).ToList(),
        plan.CriticalPath.Select(id => id.Value).ToList(),
        plan.CriticalPathLength.Value,
        plan.TotalEstimate.Value,
        plan.TeamCapacity.Value,
        plan.Assignment?.StrategyName,
        plan.Assignment?.LoadPerMember.Select(kv => new MemberLoadDto(kv.Key.Value, kv.Value.Value)).ToList() ?? [],
        plan.Warnings.Select(ToDto).ToList());

    private static PlannedTaskDto ToDto(PlannedTask p) => new(
        p.Task.Id.Value,
        p.Task.Title,
        p.Position,
        p.Timing.EarliestStart.Value,
        p.Timing.EarliestFinish.Value,
        p.Timing.Slack.Value,
        p.Timing.IsCritical,
        p.EarliestFinishDate,
        p.Assignment.MemberId?.Value,
        p.Assignment.Reason);

    private static PlanWarningDto ToDto(PlanWarning w) => new(
        w.Kind,
        w.IsBlocking,
        w.Message,
        w.TaskIds.Select(id => id.Value).ToList(),
        w.MemberId?.Value);
}
