using SprintManager.Core.Domain;

namespace SprintManager.Core.Priority;

/// <summary>Weights of the priority score components.</summary>
/// <param name="Deadline">Closeness of the deadline.</param>
/// <param name="Critical">Position on the critical path (low slack).</param>
/// <param name="Blocking">How many other tasks wait on this one.</param>
/// <param name="InProgress">Bonus for finishing started work before starting new work.</param>
/// <param name="DeadlineHorizonDays">Working days ahead at which a deadline stops contributing urgency.</param>
public sealed record PriorityWeights(
    double Deadline = 1.0,
    double Critical = 1.0,
    double Blocking = 1.0,
    double InProgress = 0.5,
    int DeadlineHorizonDays = 10)
{
    /// <summary>Default weights.</summary>
    public static readonly PriorityWeights Default = new();
}

/// <summary>Input of the priority scorer.</summary>
/// <param name="SprintTasks">All tasks in the sprint (needed for dependencies and slack), done or not.</param>
/// <param name="MemberId">Whose list to rank.</param>
/// <param name="Today">Reference date for deadlines.</param>
/// <param name="Calendar">Working-day calendar.</param>
/// <param name="Weights">Score weights.</param>
public sealed record PriorityRequest(
    IReadOnlyList<WorkItem> SprintTasks,
    MemberId MemberId,
    DateOnly Today,
    WorkCalendar? Calendar = null,
    PriorityWeights? Weights = null);

/// <summary>The normalised (0..1) components behind a score, kept so the UI can explain the rank.</summary>
/// <param name="DeadlineUrgency">1 = overdue or due today, 0 = no deadline or beyond the horizon.</param>
/// <param name="Criticality">1 = zero slack, 0 = the most slack in the sprint.</param>
/// <param name="BlockingShare">Share of the other open tasks that transitively wait on this one.</param>
/// <param name="IsInProgress">Already started.</param>
public sealed record PriorityComponents(double DeadlineUrgency, double Criticality, double BlockingShare, bool IsInProgress);

/// <summary>One ranked task.</summary>
/// <param name="Task">The task.</param>
/// <param name="Rank">1 = do first.</param>
/// <param name="Score">Weighted sum of the components.</param>
/// <param name="Components">Breakdown.</param>
/// <param name="BlockedCount">Number of open tasks that transitively wait on this one.</param>
/// <param name="Reason">Short explanation shown next to the task.</param>
public sealed record PrioritizedTask(
    WorkItem Task,
    int Rank,
    double Score,
    PriorityComponents Components,
    int BlockedCount,
    string Reason);
