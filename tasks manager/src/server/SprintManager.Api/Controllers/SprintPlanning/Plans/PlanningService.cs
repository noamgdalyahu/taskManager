using SprintManager.Api.Controllers.Tasks.Events;
using SprintManager.Api.Jobs;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Assignment;
using SprintManager.Core.Domain;
using SprintManager.Core.Planning;

namespace SprintManager.Api.Controllers.SprintPlanning.Plans;

/// <summary>Why a planning request was refused.</summary>
public enum PlanningErrorCode
{
    /// <summary>Sprint does not exist.</summary>
    SprintNotFound,
    /// <summary>Caller is not the manager of this project.</summary>
    Forbidden,
    /// <summary>Unknown strategy name.</summary>
    UnknownStrategy,
    /// <summary>Queue is full; try again shortly.</summary>
    QueueFull,
    /// <summary>Job does not exist or is not visible to the caller.</summary>
    JobNotFound,
    /// <summary>Job is not finished, failed, or its plan is not feasible.</summary>
    PlanNotApplicable,
    /// <summary>The sprint is Active or Closed; planning only applies before it starts.</summary>
    SprintAlreadyStarted,
}

/// <summary>Outcome of enqueue / get job.</summary>
public sealed record PlanningResult
{
    /// <summary>Success flag.</summary>
    public bool IsSuccess { get; private init; }

    /// <summary>The job on success.</summary>
    public PlanJob? Job { get; private init; }

    /// <summary>The error on failure.</summary>
    public PlanningErrorCode? Error { get; private init; }

    /// <summary>Success.</summary>
    public static PlanningResult Success(PlanJob job) => new() { IsSuccess = true, Job = job };

    /// <summary>Failure.</summary>
    public static PlanningResult Failed(PlanningErrorCode error) => new() { IsSuccess = false, Error = error };
}

/// <summary>
/// Request side: authorises and enqueues planning jobs. Worker side: executes them.
/// Both live here so the job lifecycle is in one place.
/// </summary>
public sealed class PlanningService(
    ISprintRepository sprints,
    IProjectRepository projects,
    ITaskRepository tasks,
    IUserRepository users,
    IPlanJobRepository jobs,
    IPlanJobQueue queue,
    TaskChangePublisher publisher,
    IClock clock,
    ILogger<PlanningService> logger)
{
    private static readonly IReadOnlyDictionary<string, Func<IAssignmentStrategy>> Strategies =
        new Dictionary<string, Func<IAssignmentStrategy>>(StringComparer.OrdinalIgnoreCase)
        {
            ["Hungarian"] = () => new HungarianAssignmentStrategy(),
            ["Greedy"] = () => new GreedyAssignmentStrategy(),
        };

    /// <summary>Creates a queued job for the sprint; the caller must be a manager on the project.</summary>
    public async Task<PlanningResult> EnqueueAsync(SprintId sprintId, string? strategyName, CurrentUser caller, CancellationToken cancellationToken)
    {
        var strategy = strategyName ?? "Hungarian";
        if (!Strategies.ContainsKey(strategy))
            return PlanningResult.Failed(PlanningErrorCode.UnknownStrategy);

        var sprint = await sprints.GetAsync(sprintId, cancellationToken);
        if (sprint is null)
            return PlanningResult.Failed(PlanningErrorCode.SprintNotFound);

        var project = await projects.GetAsync(sprint.ProjectId, cancellationToken);
        if (project is null || !caller.IsManager || !project.HasMember(caller.Id))
            return PlanningResult.Failed(PlanningErrorCode.Forbidden);
        // Planning decides who does what before the sprint begins; once it is Active or Closed the assignments are the team's working state.
        if (sprint.Status is not SprintStatus.Planned)
            return PlanningResult.Failed(PlanningErrorCode.SprintAlreadyStarted);

        var job = PlanJob.Queued(sprintId, project.Id, caller.Id, strategy, clock.UtcNow);
        await jobs.AddAsync(job, cancellationToken);

        if (!queue.TryEnqueue(job.Id))
        {
            await jobs.UpdateAsync(job.Faulted("Queue full", clock.UtcNow), cancellationToken);
            return PlanningResult.Failed(PlanningErrorCode.QueueFull);
        }

        return PlanningResult.Success(job);
    }

    /// <summary>Loads a job if the caller belongs to its project.</summary>
    public async Task<PlanningResult> GetJobAsync(JobId jobId, CurrentUser caller, CancellationToken cancellationToken)
    {
        var job = await jobs.GetAsync(jobId, cancellationToken);
        if (job is null)
            return PlanningResult.Failed(PlanningErrorCode.JobNotFound);

        var project = await projects.GetAsync(job.ProjectId, cancellationToken);
        return project is not null && project.HasMember(caller.Id)
            ? PlanningResult.Success(job)
            : PlanningResult.Failed(PlanningErrorCode.JobNotFound); // do not reveal existence across projects
    }

    /// <summary>
    /// Applies a finished plan: writes the suggested assignee onto every task that has one.
    /// Tasks the manager already reassigned by hand since the job ran are left alone (their UpdatedAt is newer).
    /// </summary>
    public async Task<PlanningResult> AcceptAsync(JobId jobId, CurrentUser caller, CancellationToken cancellationToken)
    {
        var job = await jobs.GetAsync(jobId, cancellationToken);
        if (job is null)
            return PlanningResult.Failed(PlanningErrorCode.JobNotFound);

        var project = await projects.GetAsync(job.ProjectId, cancellationToken);
        if (project is null || !caller.IsManager || !project.HasMember(caller.Id))
            return PlanningResult.Failed(PlanningErrorCode.Forbidden);
        if (job.Status is not PlanJobStatus.Done || job.Result is null || !job.Result.IsFeasible)
            return PlanningResult.Failed(PlanningErrorCode.PlanNotApplicable);

        var current = (await tasks.GetForSprintAsync(job.SprintId, cancellationToken)).ToDictionary(t => t.Id);
        var now = clock.UtcNow;
        var changes = new List<TaskChanged>();
        foreach (var planned in job.Result.Tasks)
        {
            if (planned.Assignment.MemberId is not { } assignee
                || !current.TryGetValue(planned.Task.Id, out var before)
                || before.AssigneeId == assignee
                || before.UpdatedAt > job.FinishedAt)
                continue;

            var after = before with { AssigneeId = assignee, UpdatedAt = now };
            changes.Add(new TaskChanged(before, after, caller.Id, now));
        }

        await tasks.UpdateManyAsync(changes.Select(c => c.After).ToList(), cancellationToken);
        foreach (var change in changes)
            await publisher.PublishAsync(change, cancellationToken);

        logger.LogInformation("Plan {Job} accepted: {Count} assignments applied", job.Id, changes.Count);
        return PlanningResult.Success(job);
    }

    /// <summary>Worker entry point: loads inputs, runs the planner, stores the result.</summary>
    public async Task RunAsync(JobId jobId, CancellationToken cancellationToken)
    {
        var job = await jobs.GetAsync(jobId, cancellationToken);
        if (job is null || job.Status is not PlanJobStatus.Queued)
            return;

        job = job.Started(clock.UtcNow);
        await jobs.UpdateAsync(job, cancellationToken);

        try
        {
            var plan = await ComputeAsync(job, cancellationToken);
            await jobs.UpdateAsync(job.Completed(plan, clock.UtcNow), cancellationToken);
            logger.LogInformation("Job {Job} done: {Tasks} tasks, {Warnings} warnings", job.Id, plan.Tasks.Count, plan.Warnings.Count);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            await jobs.UpdateAsync(job.Faulted("Timed out", clock.UtcNow), CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Job {Job} failed", job.Id);
            await jobs.UpdateAsync(job.Faulted(ex.Message, clock.UtcNow), CancellationToken.None);
        }
    }

    private async Task<SprintPlan> ComputeAsync(PlanJob job, CancellationToken cancellationToken)
    {
        var sprint = await sprints.GetAsync(job.SprintId, cancellationToken)
            ?? throw new InvalidOperationException("Sprint was deleted.");
        var project = await projects.GetAsync(job.ProjectId, cancellationToken)
            ?? throw new InvalidOperationException("Project was deleted.");

        var sprintTasks = await tasks.GetForSprintAsync(sprint.Id, cancellationToken);
        var team = await users.GetManyAsync(project.MemberIds, cancellationToken);

        var calendar = WorkCalendar.Default;
        var workingDays = calendar.WorkingDaysBetween(sprint.StartDate, sprint.EndDate);
        var request = new SprintPlanRequest(
            sprintTasks.Where(t => !t.ToWorkItem().IsDone).Select(t => t.ToWorkItem()).ToList(),
            team.Select(u => u.ToMember(workingDays, calendar)).ToList(),
            sprint.StartDate,
            sprint.EndDate,
            calendar);

        // CPU-bound work on a thread-pool thread so the worker loop stays responsive to cancellation.
        var planner = new SprintPlanner(Strategies[job.StrategyName]());
        return await Task.Run(() => planner.Plan(request), cancellationToken);
    }
}
