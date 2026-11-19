using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Board;

/// <summary>Board data: tasks of a sprint (grouped into columns by the mapper).</summary>
public sealed record BoardView(Sprint Sprint, IReadOnlyList<TaskItem> Tasks, IReadOnlyDictionary<TaskId, TaskItem> ProjectTasks);

/// <summary>Kanban board for a sprint.</summary>
public sealed class BoardService(ISprintRepository sprints, ITaskRepository tasks, ProjectAccess access)
{
    /// <summary>Board of a sprint, optionally filtered to one member.</summary>
    public async Task<OperationResult<BoardView>> GetBoardAsync(SprintId sprintId, MemberId? onlyMember, CurrentUser caller, CancellationToken ct)
    {
        var sprint = await sprints.GetAsync(sprintId, ct);
        if (sprint is null)
            return OperationResult.NotFound<BoardView>("Sprint");
        var found = await access.AsMemberAsync(sprint.ProjectId, caller, ct);
        if (!found.IsSuccess)
            return OperationResult.NotFound<BoardView>("Sprint");

        var projectTasks = await tasks.GetForProjectAsync(sprint.ProjectId, ct);
        var sprintTasks = projectTasks.Where(t => t.SprintId == sprintId && (onlyMember is null || t.AssigneeId == onlyMember)).ToList();
        return OperationResult<BoardView>.Ok(new BoardView(sprint, sprintTasks, projectTasks.ToDictionary(t => t.Id)));
    }
}
