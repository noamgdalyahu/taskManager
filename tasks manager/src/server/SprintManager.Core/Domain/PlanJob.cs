using SprintManager.Core.Planning;

namespace SprintManager.Core.Domain;

/// <summary>Strongly typed identifier of a background job.</summary>
public readonly record struct JobId(Guid Value)
{
    /// <summary>Creates a new random id.</summary>
    public static JobId New() => new(Guid.NewGuid());

    /// <inheritdoc />
    public override string ToString() => Value.ToString();
}

/// <summary>Lifecycle of a background job.</summary>
public enum PlanJobStatus
{
    /// <summary>Waiting for a worker.</summary>
    Queued,
    /// <summary>A worker picked it up.</summary>
    Running,
    /// <summary>Finished with a result.</summary>
    Done,
    /// <summary>Finished with an error.</summary>
    Failed,
}

/// <summary>
/// A sprint planning run executed off the request path. The client polls it by id.
/// Persisted so results survive restarts and so load can be analysed (queue time, run time).
/// </summary>
/// <param name="Id">Identity.</param>
/// <param name="SprintId">Sprint being planned.</param>
/// <param name="ProjectId">Owning project (for authorization without a second lookup).</param>
/// <param name="RequestedBy">Manager who clicked "Suggest plan".</param>
/// <param name="StrategyName">Assignment strategy to use ("Hungarian" or "Greedy").</param>
/// <param name="Status">Lifecycle.</param>
/// <param name="CreatedAt">Enqueued.</param>
/// <param name="StartedAt">Picked up by a worker.</param>
/// <param name="FinishedAt">Done or failed.</param>
/// <param name="Result">The plan, when done.</param>
/// <param name="Error">Message, when failed.</param>
public sealed record PlanJob(
    JobId Id,
    SprintId SprintId,
    ProjectId ProjectId,
    MemberId RequestedBy,
    string StrategyName,
    PlanJobStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? StartedAt,
    DateTimeOffset? FinishedAt,
    SprintPlan? Result,
    string? Error)
{
    /// <summary>Creates a queued job.</summary>
    public static PlanJob Queued(SprintId sprintId, ProjectId projectId, MemberId requestedBy, string strategyName, DateTimeOffset now) =>
        new(JobId.New(), sprintId, projectId, requestedBy, strategyName, PlanJobStatus.Queued, now, null, null, null, null);

    /// <summary>Transition to running.</summary>
    public PlanJob Started(DateTimeOffset now) => this with { Status = PlanJobStatus.Running, StartedAt = now };

    /// <summary>Transition to done.</summary>
    public PlanJob Completed(SprintPlan result, DateTimeOffset now) => this with { Status = PlanJobStatus.Done, FinishedAt = now, Result = result };

    /// <summary>Transition to failed.</summary>
    public PlanJob Faulted(string error, DateTimeOffset now) => this with { Status = PlanJobStatus.Failed, FinishedAt = now, Error = error };

    /// <summary>Time spent waiting in the queue, once started.</summary>
    public TimeSpan? QueueTime => StartedAt - CreatedAt;

    /// <summary>Time spent computing, once finished.</summary>
    public TimeSpan? RunTime => FinishedAt - StartedAt;
}
