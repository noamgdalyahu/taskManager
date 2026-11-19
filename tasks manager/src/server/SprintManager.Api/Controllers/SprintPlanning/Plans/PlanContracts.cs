using System.ComponentModel.DataAnnotations;
using SprintManager.Core.Domain;
using SprintManager.Core.Planning;

namespace SprintManager.Api.Controllers.SprintPlanning.Plans;

/// <summary>Request to start a planning job.</summary>
/// <param name="Strategy">"Hungarian" (default) or "Greedy" for comparison.</param>
public sealed record SuggestPlanRequest([MaxLength(20)] string? Strategy = null);

/// <summary>A background job as seen by the client.</summary>
public sealed record PlanJobDto(
    Guid Id,
    Guid SprintId,
    string Strategy,
    PlanJobStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? StartedAt,
    DateTimeOffset? FinishedAt,
    double? QueueMilliseconds,
    double? RunMilliseconds,
    SprintPlanDto? Result,
    string? Error);

/// <summary>A plan as seen by the client.</summary>
public sealed record SprintPlanDto(
    bool IsFeasible,
    IReadOnlyList<PlannedTaskDto> Tasks,
    IReadOnlyList<Guid> CriticalPath,
    double CriticalPathHours,
    double TotalEstimateHours,
    double TeamCapacityHours,
    string? StrategyName,
    IReadOnlyList<MemberLoadDto> Loads,
    IReadOnlyList<PlanWarningDto> Warnings);

/// <summary>One planned task.</summary>
public sealed record PlannedTaskDto(
    Guid TaskId,
    string Title,
    int Position,
    double EarliestStartHours,
    double EarliestFinishHours,
    double SlackHours,
    bool IsCritical,
    DateOnly EarliestFinishDate,
    Guid? SuggestedAssigneeId,
    string AssignmentReason);

/// <summary>Manual vs Greedy vs Hungarian on the same tasks.</summary>
/// <param name="IsComparable">False when the tasks contain a dependency cycle.</param>
/// <param name="Message">Explanation when not comparable.</param>
/// <param name="Winner">The single best approach, or null on a tie.</param>
/// <param name="Winners">All approaches sharing the best score (more than one means a tie).</param>
/// <param name="Scores">Manual (when something is assigned), Greedy and Hungarian.</param>
public sealed record PlanComparisonDto(bool IsComparable, string? Message, string? Winner, IReadOnlyList<string> Winners, IReadOnlyList<StrategyScoreDto> Scores);

/// <summary>One approach's score. Lower objective is better; imbalance 0 is perfectly balanced.</summary>
public sealed record StrategyScoreDto(
    string Name, double Objective, double SkillCost, double LoadImbalance,
    int Unassigned, int SkillMismatches, int OverCapacityMembers, double Milliseconds);

/// <summary>Hours assigned per member.</summary>
public sealed record MemberLoadDto(Guid MemberId, double Hours);

/// <summary>A plan warning.</summary>
public sealed record PlanWarningDto(PlanWarningKind Kind, bool IsBlocking, string Message, IReadOnlyList<Guid> TaskIds, Guid? MemberId);
