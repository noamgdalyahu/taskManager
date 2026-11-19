using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks;

/// <summary>
/// Resource-based authorization for a single task: resolves the task, then defers to
/// <see cref="ProjectAccess"/> for its project. Shared by tasks, comments and time logs so a task of
/// another team always looks like "not found".
/// </summary>
public sealed class TaskAccess(ITaskRepository tasks, ProjectAccess access)
{
    /// <summary>Loads the task if the caller belongs to its project.</summary>
    public async Task<OperationResult<TaskItem>> AsMemberAsync(TaskId id, CurrentUser caller, CancellationToken ct)
    {
        var task = await tasks.GetAsync(id, ct);
        if (task is null)
            return OperationResult.NotFound<TaskItem>("Task");

        var found = await access.AsMemberAsync(task.ProjectId, caller, ct);
        return found.IsSuccess ? OperationResult<TaskItem>.Ok(task) : OperationResult.NotFound<TaskItem>("Task");
    }

    /// <summary>Loads the task if the caller is a manager of its project.</summary>
    public async Task<OperationResult<TaskItem>> AsManagerAsync(TaskId id, CurrentUser caller, CancellationToken ct)
    {
        var loaded = await AsMemberAsync(id, caller, ct);
        if (!loaded.IsSuccess)
            return loaded;
        return caller.IsManager ? loaded : OperationResult.Forbidden<TaskItem>("Only managers edit tasks.");
    }
}
