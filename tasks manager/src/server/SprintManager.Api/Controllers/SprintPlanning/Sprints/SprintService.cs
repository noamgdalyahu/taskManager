using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.SprintPlanning.Sprints;

/// <summary>A sprint together with the numbers the UI shows next to it.</summary>
public sealed record SprintView(Sprint Sprint, int WorkingDays, double TeamCapacityHours, IReadOnlyList<TaskItem> Tasks);

/// <summary>Sprint lifecycle: create, edit, start, close.</summary>
public sealed class SprintService(
    ISprintRepository sprints,
    ITaskRepository tasks,
    IUserRepository users,
    ProjectAccess access,
    IClock clock)
{
    /// <summary>Sprints of a project.</summary>
    public async Task<OperationResult<IReadOnlyList<SprintView>>> ListAsync(ProjectId projectId, CurrentUser caller, CancellationToken ct)
    {
        var found = await access.AsMemberAsync(projectId, caller, ct);
        if (!found.IsSuccess)
            return OperationResult<IReadOnlyList<SprintView>>.Fail(found.Error!.Value);

        var list = await sprints.GetForProjectAsync(projectId, ct);
        var views = new List<SprintView>(list.Count);
        foreach (var s in list)
            views.Add(await ViewAsync(s, found.Value!, ct));
        return OperationResult<IReadOnlyList<SprintView>>.Ok(views);
    }

    /// <summary>One sprint.</summary>
    public async Task<OperationResult<SprintView>> GetAsync(SprintId id, CurrentUser caller, CancellationToken ct)
    {
        var sprint = await sprints.GetAsync(id, ct);
        if (sprint is null)
            return OperationResult.NotFound<SprintView>("Sprint");

        var found = await access.AsMemberAsync(sprint.ProjectId, caller, ct);
        return found.IsSuccess
            ? OperationResult<SprintView>.Ok(await ViewAsync(sprint, found.Value!, ct))
            : OperationResult.NotFound<SprintView>("Sprint");
    }

    /// <summary>Creates a planned sprint.</summary>
    public async Task<OperationResult<SprintView>> CreateAsync(ProjectId projectId, SprintRequest request, CurrentUser caller, CancellationToken ct)
    {
        var found = await access.AsManagerAsync(projectId, caller, ct);
        if (!found.IsSuccess)
            return OperationResult<SprintView>.Fail(found.Error!.Value);
        if (request.EndDate < request.StartDate)
            return OperationResult.Invalid<SprintView>("End date must not be before start date.");

        var sprint = new Sprint(SprintId.New(), projectId, request.Name.Trim(), request.StartDate, request.EndDate, SprintStatus.Planned, clock.UtcNow);
        await sprints.AddAsync(sprint, ct);
        return OperationResult<SprintView>.Ok(await ViewAsync(sprint, found.Value!, ct));
    }

    /// <summary>Edits name and dates.</summary>
    public async Task<OperationResult<SprintView>> UpdateAsync(SprintId id, SprintRequest request, CurrentUser caller, CancellationToken ct)
    {
        var loaded = await LoadAsManagerAsync(id, caller, ct);
        if (!loaded.IsSuccess)
            return OperationResult<SprintView>.Fail(loaded.Error!.Value);
        if (request.EndDate < request.StartDate)
            return OperationResult.Invalid<SprintView>("End date must not be before start date.");

        var (sprint, project) = loaded.Value!;
        var updated = sprint with { Name = request.Name.Trim(), StartDate = request.StartDate, EndDate = request.EndDate };
        await sprints.UpdateAsync(updated, ct);
        return OperationResult<SprintView>.Ok(await ViewAsync(updated, project, ct));
    }

    /// <summary>Planned → Active → Closed, forward only.</summary>
    public async Task<OperationResult<SprintView>> TransitionAsync(SprintId id, SprintStatus next, CurrentUser caller, CancellationToken ct)
    {
        var loaded = await LoadAsManagerAsync(id, caller, ct);
        if (!loaded.IsSuccess)
            return OperationResult<SprintView>.Fail(loaded.Error!.Value);

        var (sprint, project) = loaded.Value!;
        var allowed = (sprint.Status, next) is (SprintStatus.Planned, SprintStatus.Active) or (SprintStatus.Active, SprintStatus.Closed);
        if (!allowed)
            return OperationResult.Conflict<SprintView>($"Cannot move a {sprint.Status} sprint to {next}.");

        var updated = sprint with { Status = next };
        await sprints.UpdateAsync(updated, ct);
        return OperationResult<SprintView>.Ok(await ViewAsync(updated, project, ct));
    }

    private async Task<OperationResult<(Sprint, Project)>> LoadAsManagerAsync(SprintId id, CurrentUser caller, CancellationToken ct)
    {
        var sprint = await sprints.GetAsync(id, ct);
        if (sprint is null)
            return OperationResult.NotFound<(Sprint, Project)>("Sprint");
        var found = await access.AsManagerAsync(sprint.ProjectId, caller, ct);
        return found.IsSuccess
            ? OperationResult<(Sprint, Project)>.Ok((sprint, found.Value!))
            : OperationResult<(Sprint, Project)>.Fail(found.Error!.Value);
    }

    private async Task<SprintView> ViewAsync(Sprint sprint, Project project, CancellationToken ct)
    {
        var calendar = WorkCalendar.Default;
        var days = calendar.WorkingDaysBetween(sprint.StartDate, sprint.EndDate);
        var team = await users.GetManyAsync(project.MemberIds, ct);
        var capacity = team.Sum(u => u.ToMember(days, calendar).Capacity.Value);
        var sprintTasks = await tasks.GetForSprintAsync(sprint.Id, ct);
        return new SprintView(sprint, days, capacity, sprintTasks);
    }
}
