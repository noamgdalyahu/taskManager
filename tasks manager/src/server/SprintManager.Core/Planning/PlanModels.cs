using SprintManager.Core.Assignment;
using SprintManager.Core.Domain;
using SprintManager.Core.Graph;

namespace SprintManager.Core.Planning;

/// <summary>Everything needed to plan one sprint.</summary>
/// <param name="Tasks">Tasks selected from the backlog.</param>
/// <param name="Members">Team for the sprint.</param>
/// <param name="SprintStart">First day.</param>
/// <param name="SprintEnd">Last day (inclusive).</param>
/// <param name="Calendar">Hours per day and weekends.</param>
/// <param name="Weights">Assignment cost weights.</param>
public sealed record SprintPlanRequest(
    IReadOnlyList<WorkItem> Tasks,
    IReadOnlyList<Member> Members,
    DateOnly SprintStart,
    DateOnly SprintEnd,
    WorkCalendar? Calendar = null,
    AssignmentWeights? Weights = null)
{
    /// <summary>Calendar in use.</summary>
    public WorkCalendar EffectiveCalendar => Calendar ?? WorkCalendar.Default;

    /// <summary>Weights in use.</summary>
    public AssignmentWeights EffectiveWeights => Weights ?? AssignmentWeights.Default;
}

/// <summary>Categories of planning warnings, from blocking to advisory.</summary>
public enum PlanWarningKind
{
    /// <summary>Tasks depend on each other in a loop; no plan is possible until it is broken.</summary>
    DependencyCycle,
    /// <summary>Even with unlimited people the critical path is longer than the sprint.</summary>
    ExceedsSprintLength,
    /// <summary>Total estimated hours exceed the team's total capacity.</summary>
    ExceedsTeamCapacity,
    /// <summary>A task's earliest possible finish is after its deadline.</summary>
    DeadlineAtRisk,
    /// <summary>No member has the skills for a task.</summary>
    NoEligibleMember,
    /// <summary>A member is assigned more hours than their capacity.</summary>
    OverCapacity,
}

/// <summary>A planning warning for the manager.</summary>
/// <param name="Kind">Category.</param>
/// <param name="Message">Human readable text.</param>
/// <param name="TaskIds">Related tasks (a cycle lists every task on it).</param>
/// <param name="MemberId">Related member, if any.</param>
public sealed record PlanWarning(PlanWarningKind Kind, string Message, IReadOnlyList<TaskId> TaskIds, MemberId? MemberId = null)
{
    /// <summary>True for warnings that make the plan unusable.</summary>
    public bool IsBlocking => Kind is PlanWarningKind.DependencyCycle;
}

/// <summary>A task in the suggested order, with its CPM timing and suggested assignee.</summary>
/// <param name="Task">The task.</param>
/// <param name="Position">0-based position in the suggested order.</param>
/// <param name="Timing">CPM timing.</param>
/// <param name="EarliestFinishDate">CPM earliest finish mapped onto the calendar.</param>
/// <param name="Assignment">Suggested assignee and reason.</param>
public sealed record PlannedTask(
    WorkItem Task,
    int Position,
    TaskTiming Timing,
    DateOnly EarliestFinishDate,
    TaskAssignment Assignment);

/// <summary>Outcome of sprint planning.</summary>
public sealed record SprintPlan
{
    /// <summary>False when a blocking warning (cycle) prevented planning.</summary>
    public bool IsFeasible => Warnings.All(w => !w.IsBlocking);

    /// <summary>Tasks in suggested execution order; empty when not feasible.</summary>
    public IReadOnlyList<PlannedTask> Tasks { get; init; } = [];

    /// <summary>Critical path task ids, first to last.</summary>
    public IReadOnlyList<TaskId> CriticalPath { get; init; } = [];

    /// <summary>Length of the critical path in effort hours.</summary>
    public Hours CriticalPathLength { get; init; } = Hours.Zero;

    /// <summary>Sum of all estimates.</summary>
    public Hours TotalEstimate { get; init; } = Hours.Zero;

    /// <summary>Sum of member capacities.</summary>
    public Hours TeamCapacity { get; init; } = Hours.Zero;

    /// <summary>Assignment details (loads, strategy name); null when not feasible.</summary>
    public AssignmentResult? Assignment { get; init; }

    /// <summary>All warnings, blocking first.</summary>
    public IReadOnlyList<PlanWarning> Warnings { get; init; } = [];
}
