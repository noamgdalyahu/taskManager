using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Controllers.Tasks.Events;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks;

/// <summary>Task detail aggregate.</summary>
public sealed record TaskDetail(TaskItem Task, IReadOnlyDictionary<TaskId, TaskItem> ProjectTasks, IReadOnlyList<Comment> Comments, IReadOnlyList<HistoryEntry> History, IReadOnlyList<TimeLog> TimeLogs);

/// <summary>A task plus the project index needed to compute "waiting for".</summary>
public sealed record TaskView(TaskItem Task, IReadOnlyDictionary<TaskId, TaskItem> ProjectTasks);

/// <summary>Backlog and task detail: CRUD, status rules, assignment. Comments and time logs have their own services.</summary>
public sealed class TaskService(
    ITaskRepository tasks,
    ISprintRepository sprints,
    ICommentRepository comments,
    IHistoryRepository history,
    ITimeLogRepository timeLogs,
    ProjectAccess access,
    TaskAccess taskAccess,
    TaskChangePublisher publisher,
    IClock clock)
{
    /// <summary>All tasks of a project (backlog + sprints).</summary>
    public async Task<OperationResult<IReadOnlyList<TaskView>>> ListForProjectAsync(ProjectId projectId, CurrentUser caller, CancellationToken ct)
    {
        var found = await access.AsMemberAsync(projectId, caller, ct);
        if (!found.IsSuccess)
            return OperationResult<IReadOnlyList<TaskView>>.Fail(found.Error!.Value);

        var all = await tasks.GetForProjectAsync(projectId, ct);
        var byId = all.ToDictionary(t => t.Id);
        return OperationResult<IReadOnlyList<TaskView>>.Ok(all.Select(t => new TaskView(t, byId)).ToList());
    }

    /// <summary>Detail page.</summary>
    public async Task<OperationResult<TaskDetail>> GetDetailAsync(TaskId id, CurrentUser caller, CancellationToken ct)
    {
        var loaded = await taskAccess.AsMemberAsync(id, caller, ct);
        if (!loaded.IsSuccess)
            return OperationResult<TaskDetail>.Fail(loaded.Error!.Value);

        var task = loaded.Value!;
        var projectTasks = (await tasks.GetForProjectAsync(task.ProjectId, ct)).ToDictionary(t => t.Id);
        return OperationResult<TaskDetail>.Ok(new TaskDetail(
            task,
            projectTasks,
            await comments.GetForTaskAsync(id, ct),
            await history.GetForTaskAsync(id, ct),
            await timeLogs.GetForTaskAsync(id, ct)));
    }

    /// <summary>Creates a task; any member of the project may (decided by the user).</summary>
    public async Task<OperationResult<TaskView>> CreateAsync(ProjectId projectId, CreateTaskRequest request, CurrentUser caller, CancellationToken ct)
    {
        var found = await access.AsMemberAsync(projectId, caller, ct);
        if (!found.IsSuccess)
            return OperationResult<TaskView>.Fail(found.Error!.Value);

        var projectTasks = await tasks.GetForProjectAsync(projectId, ct);
        var id = TaskId.New();
        var deps = (request.DependsOn ?? []).Select(d => new TaskId(d)).Distinct().ToList();
        var check = await ValidateLinksAsync(id, projectId, deps, request.SprintId, projectTasks, ct);
        if (check is { } error)
            return OperationResult<TaskView>.Fail(error);

        var now = clock.UtcNow;
        var task = new TaskItem(id, projectId, request.SprintId is { } s ? new SprintId(s) : null, request.Title.Trim(), request.Description?.Trim() ?? "",
            new Hours(request.EstimateHours), request.Deadline, WorkItemStatus.ToDo, null, Normalise(request.RequiredSkills), deps, now, now, null, request.Type);

        await tasks.AddAsync(task, ct);
        await publisher.PublishAsync(new TaskChanged(null, task, caller.Id, now), ct);
        return OperationResult<TaskView>.Ok(new TaskView(task, Index(projectTasks, task)));
    }

    /// <summary>Full edit (managers). Status is changed through <see cref="ChangeStatusAsync"/> so the rules apply.</summary>
    public async Task<OperationResult<TaskView>> UpdateAsync(TaskId id, UpdateTaskRequest request, CurrentUser caller, CancellationToken ct)
    {
        var loaded = await taskAccess.AsManagerAsync(id, caller, ct);
        if (!loaded.IsSuccess)
            return OperationResult<TaskView>.Fail(loaded.Error!.Value);

        var before = loaded.Value!;
        var projectTasks = await tasks.GetForProjectAsync(before.ProjectId, ct);
        var deps = (request.DependsOn ?? []).Select(d => new TaskId(d)).Distinct().ToList();
        var check = await ValidateLinksAsync(id, before.ProjectId, deps, request.SprintId, projectTasks, ct);
        if (check is { } error)
            return OperationResult<TaskView>.Fail(error);

        var after = before with
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? "",
            Estimate = new Hours(request.EstimateHours),
            Deadline = request.Deadline,
            RequiredSkills = Normalise(request.RequiredSkills),
            DependsOn = deps,
            SprintId = request.SprintId is { } s ? new SprintId(s) : null,
            AssigneeId = request.AssigneeId is { } a ? new MemberId(a) : null,
            Type = request.Type,
            UpdatedAt = clock.UtcNow,
        };
        return await SaveAsync(before, after, caller, projectTasks, ct);
    }

    /// <summary>Status change; any member of the project may move any task (decided by the user). Dependencies do not block a move (decided by the user): the planner and the chains still use them for ordering.</summary>
    public async Task<OperationResult<TaskView>> ChangeStatusAsync(TaskId id, WorkItemStatus next, CurrentUser caller, CancellationToken ct)
    {
        var loaded = await taskAccess.AsMemberAsync(id, caller, ct);
        if (!loaded.IsSuccess)
            return OperationResult<TaskView>.Fail(loaded.Error!.Value);

        var before = loaded.Value!;
        var projectTasks = await tasks.GetForProjectAsync(before.ProjectId, ct);
        var rule = TaskRules.CanChangeStatus(before, next, []);
        if (!rule.IsAllowed)
        {
            return rule.Error switch
            {
                StatusChangeError.NoChange => OperationResult<TaskView>.Ok(new TaskView(before, projectTasks.ToDictionary(t => t.Id))),
                _ => OperationResult.Conflict<TaskView>("Transition not allowed."),
            };
        }

        var now = clock.UtcNow;
        var after = before with { Status = next, UpdatedAt = now, CompletedAt = next is WorkItemStatus.Done ? now : null };
        return await SaveAsync(before, after, caller, projectTasks, ct);
    }

    /// <summary>Assign or unassign; any member of the project may do it (decided by the user).</summary>
    public async Task<OperationResult<TaskView>> AssignAsync(TaskId id, MemberId? assignee, CurrentUser caller, CancellationToken ct)
    {
        var loaded = await taskAccess.AsMemberAsync(id, caller, ct);
        if (!loaded.IsSuccess)
            return OperationResult<TaskView>.Fail(loaded.Error!.Value);

        var before = loaded.Value!;
        var project = await access.AsMemberAsync(before.ProjectId, caller, ct);
        if (assignee is { } a && !project.Value!.HasMember(a))
            return OperationResult.Invalid<TaskView>("Assignee is not a member of this project.");

        var projectTasks = await tasks.GetForProjectAsync(before.ProjectId, ct);
        return await SaveAsync(before, before with { AssigneeId = assignee, UpdatedAt = clock.UtcNow }, caller, projectTasks, ct);
    }

    /// <summary>
    /// Deletes a task (managers). Tasks that waited for it stop waiting (it is removed from their dependencies), and its
    /// comments, time logs and history go with it. A deleted task does not count in sprint totals or reports any more.
    /// </summary>
    public async Task<OperationResult<bool>> DeleteAsync(TaskId id, CurrentUser caller, CancellationToken ct)
    {
        var loaded = await taskAccess.AsManagerAsync(id, caller, ct);
        if (!loaded.IsSuccess)
            return OperationResult<bool>.Fail(loaded.Error!.Value);

        var now = clock.UtcNow;
        var dependants = (await tasks.GetForProjectAsync(loaded.Value!.ProjectId, ct))
            .Where(t => t.DependsOn.Contains(id))
            .Select(t => t with { DependsOn = t.DependsOn.Where(d => d != id).ToList(), UpdatedAt = now })
            .ToList();
        await tasks.UpdateManyAsync(dependants, ct);

        await comments.DeleteForTaskAsync(id, ct);
        await timeLogs.DeleteForTaskAsync(id, ct);
        await history.DeleteForTaskAsync(id, ct);
        await tasks.DeleteAsync(id, ct);
        return OperationResult<bool>.Ok(true);
    }

    // ---- helpers -------------------------------------------------------------

    private async Task<OperationResult<TaskView>> SaveAsync(TaskItem before, TaskItem after, CurrentUser caller, IReadOnlyList<TaskItem> projectTasks, CancellationToken ct)
    {
        await tasks.UpdateAsync(after, ct);
        await publisher.PublishAsync(new TaskChanged(before, after, caller.Id, after.UpdatedAt), ct);
        return OperationResult<TaskView>.Ok(new TaskView(after, Index(projectTasks, after)));
    }

    /// <summary>Dependencies must exist in the same project and not form a cycle; the sprint must belong to the project.</summary>
    private async Task<OperationError?> ValidateLinksAsync(TaskId id, ProjectId projectId, IReadOnlyList<TaskId> deps, Guid? sprintId, IReadOnlyList<TaskItem> projectTasks, CancellationToken ct)
    {
        var known = projectTasks.Select(t => t.Id).ToHashSet();
        if (deps.Any(d => !known.Contains(d)))
            return new OperationError(ErrorKind.Validation, "A dependency refers to a task outside this project.");
        if (TaskRules.WouldCreateCycle(id, deps, projectTasks))
            return new OperationError(ErrorKind.Validation, "These dependencies would create a cycle.");

        if (sprintId is { } s)
        {
            var sprint = await sprints.GetAsync(new SprintId(s), ct);
            if (sprint is null || sprint.ProjectId != projectId)
                return new OperationError(ErrorKind.Validation, "Sprint does not belong to this project.");
        }
        return null;
    }

    private static IReadOnlyDictionary<TaskId, TaskItem> Index(IReadOnlyList<TaskItem> projectTasks, TaskItem current)
    {
        var byId = projectTasks.ToDictionary(t => t.Id);
        byId[current.Id] = current;
        return byId;
    }

    private static IReadOnlyList<string> Normalise(IReadOnlyList<string>? skills) =>
        (skills ?? []).Select(s => s.Trim()).Where(s => s.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
}
