using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Controllers.Tasks.Comments;
using SprintManager.Api.Controllers.Tasks.TimeLogs;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks;

/// <summary>Backlog (project page) and task detail page.</summary>
[Route("api")]
public sealed class TasksController(TaskService service) : ApiControllerBase
{
    private static TaskDto Map(TaskView v) => v.Task.ToDto(v.ProjectTasks);

    /// <summary>All tasks of a project.</summary>
    [HttpGet("projects/{projectId:guid}/tasks")]
    [ProducesResponseType<IReadOnlyList<TaskDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> ListForProject(Guid projectId, CancellationToken ct) =>
        From(await service.ListForProjectAsync(new ProjectId(projectId), Caller, ct), list => list.Select(Map).ToList());

    /// <summary>Task detail with comments, history and time logs.</summary>
    [HttpGet("tasks/{id:guid}")]
    [ProducesResponseType<TaskDetailDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        From(await service.GetDetailAsync(new TaskId(id), Caller, ct), d => new TaskDetailDto(
            d.Task.ToDto(d.ProjectTasks),
            d.Comments.Select(c => c.ToDto()).ToList(),
            d.History.Select(h => h.ToDto()).ToList(),
            d.TimeLogs.Select(l => l.ToDto()).ToList(),
            d.TimeLogs.Sum(l => l.Hours.Value)));

    /// <summary>Creates a task (managers).</summary>
    [HttpPost("projects/{projectId:guid}/tasks")]
    [ProducesResponseType<TaskDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(Guid projectId, CreateTaskRequest request, CancellationToken ct)
    {
        var result = await service.CreateAsync(new ProjectId(projectId), request, Caller, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(Get), new { id = result.Value!.Task.Id.Value }, Map(result.Value))
            : From(result, Map);
    }

    /// <summary>Edits a task (managers).</summary>
    [HttpPut("tasks/{id:guid}")]
    [ProducesResponseType<TaskDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, UpdateTaskRequest request, CancellationToken ct) =>
        From(await service.UpdateAsync(new TaskId(id), request, Caller, ct), Map);

    /// <summary>Deletes a task with its comments, time logs and history (managers). Tasks that depended on it no longer wait for it.</summary>
    [HttpDelete("tasks/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        NoContentFrom(await service.DeleteAsync(new TaskId(id), Caller, ct));

    /// <summary>Changes status (any project member).</summary>
    [HttpPatch("tasks/{id:guid}/status")]
    [ProducesResponseType<TaskDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> ChangeStatus(Guid id, ChangeStatusRequest request, CancellationToken ct) =>
        From(await service.ChangeStatusAsync(new TaskId(id), request.Status, Caller, ct), Map);

    /// <summary>Assigns or unassigns (any project member).</summary>
    [HttpPut("tasks/{id:guid}/assignee")]
    [ProducesResponseType<TaskDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Assign(Guid id, AssignRequest request, CancellationToken ct) =>
        From(await service.AssignAsync(new TaskId(id), request.AssigneeId is { } a ? new MemberId(a) : null, Caller, ct), Map);
}
