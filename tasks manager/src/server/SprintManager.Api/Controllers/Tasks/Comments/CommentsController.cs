using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks.Comments;

/// <summary>Task detail page: the comment thread.</summary>
[Route("api/tasks/{taskId:guid}/comments")]
public sealed class CommentsController(CommentService service) : ApiControllerBase
{
    /// <summary>Adds a comment.</summary>
    [HttpPost]
    [ProducesResponseType<CommentDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Add(Guid taskId, CommentRequest request, CancellationToken ct) =>
        From(await service.AddAsync(new TaskId(taskId), request, Caller, ct), c => c.ToDto());

    /// <summary>Deletes a comment (own, or any for managers).</summary>
    [HttpDelete("{commentId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid taskId, Guid commentId, CancellationToken ct) =>
        NoContentFrom(await service.DeleteAsync(new TaskId(taskId), commentId, Caller, ct));
}
