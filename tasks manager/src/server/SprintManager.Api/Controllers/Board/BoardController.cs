using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Controllers.Tasks;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Board;

/// <summary>Sprint board (Kanban) page, for managers and members.</summary>
[Route("api")]
public sealed class BoardController(BoardService service) : ApiControllerBase
{
    /// <summary>Kanban board, optionally filtered to one member (the member's own board).</summary>
    [HttpGet("sprints/{id:guid}/board")]
    [ProducesResponseType<BoardDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Board(Guid id, [FromQuery] Guid? memberId, CancellationToken ct) =>
        From(await service.GetBoardAsync(new SprintId(id), memberId is { } m ? new MemberId(m) : null, Caller, ct), v =>
            new BoardDto(v.Sprint.Id.Value, Enum.GetValues<WorkItemStatus>()
                .Select(status => new BoardColumnDto(status, v.Tasks.Where(t => t.Status == status).Select(t => t.ToDto(v.ProjectTasks)).ToList()))
                .ToList()));
}
