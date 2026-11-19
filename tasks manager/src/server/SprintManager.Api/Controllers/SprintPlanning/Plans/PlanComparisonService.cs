using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Assignment;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.SprintPlanning.Plans;

/// <summary>
/// "Compare with manual assignment": runs the manager's current assignment, Greedy and Hungarian on the sprint's
/// open tasks and scores them identically. Cheap enough to answer directly (milliseconds for sprint-sized input),
/// so it is capped instead of queued; larger inputs must use the plan jobs.
/// </summary>
public sealed class PlanComparisonService(
    ISprintRepository sprints,
    ITaskRepository tasks,
    IUserRepository users,
    ProjectAccess access)
{
    /// <summary>Largest sprint compared interactively; Hungarian is roughly cubic (see docs/performance.md).</summary>
    public const int MaxTasks = 400;

    /// <summary>Compares the approaches for one sprint (managers).</summary>
    public async Task<OperationResult<PlanComparison>> CompareAsync(SprintId sprintId, CurrentUser caller, CancellationToken ct)
    {
        var sprint = await sprints.GetAsync(sprintId, ct);
        if (sprint is null)
            return OperationResult.NotFound<PlanComparison>("Sprint");

        var found = await access.AsMemberAsync(sprint.ProjectId, caller, ct);
        if (!found.IsSuccess)
            return found.Error!.Value.Kind == ErrorKind.NotFound
                ? OperationResult.NotFound<PlanComparison>("Sprint")
                : OperationResult<PlanComparison>.Fail(found.Error.Value);

        var open = (await tasks.GetForSprintAsync(sprintId, ct)).Where(t => t.Status is not WorkItemStatus.Done).Select(t => t.ToWorkItem()).ToList();
        if (open.Count > MaxTasks)
            return OperationResult.Invalid<PlanComparison>($"Too many open tasks to compare interactively ({open.Count} > {MaxTasks}); use a plan job.");

        var calendar = WorkCalendar.Default;
        var days = calendar.WorkingDaysBetween(sprint.StartDate, sprint.EndDate);
        var team = await users.GetManyAsync(found.Value!.MemberIds, ct);
        var members = team.Select(u => u.ToMember(days, calendar)).ToList();

        var comparison = await Task.Run(() => PlanComparer.Compare(open, members), ct);
        return OperationResult<PlanComparison>.Ok(comparison);
    }
}
