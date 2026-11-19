using SprintManager.Core.Domain;

namespace SprintManager.Core.Graph;

/// <summary>CPM timing of a single task, in hours from the start of the plan.</summary>
/// <param name="TaskId">The task.</param>
/// <param name="EarliestStart">Earliest moment all prerequisites can be finished.</param>
/// <param name="EarliestFinish"><see cref="EarliestStart"/> + estimate.</param>
/// <param name="LatestStart">Latest start that still does not delay the whole plan.</param>
/// <param name="LatestFinish">Latest finish that still does not delay the whole plan.</param>
/// <param name="Slack">How long the task can slip without delaying the plan (<see cref="LatestStart"/> − <see cref="EarliestStart"/>).</param>
public sealed record TaskTiming(
    TaskId TaskId,
    Hours EarliestStart,
    Hours EarliestFinish,
    Hours LatestStart,
    Hours LatestFinish,
    Hours Slack)
{
    /// <summary>A task with no slack: any delay delays the plan.</summary>
    public bool IsCritical => Slack.Value <= CriticalPathAnalyzer.Epsilon;
}

/// <summary>Result of the critical path analysis over an acyclic dependency graph.</summary>
/// <param name="Timings">Timing per task, indexed like <see cref="DependencyGraph.Tasks"/>.</param>
/// <param name="CriticalPath">One longest chain of critical tasks, from first to last.</param>
/// <param name="TotalDuration">Minimum time to finish everything with unlimited people (length of the critical path).</param>
public sealed record CriticalPathResult(
    IReadOnlyList<TaskTiming> Timings,
    IReadOnlyList<TaskId> CriticalPath,
    Hours TotalDuration);
