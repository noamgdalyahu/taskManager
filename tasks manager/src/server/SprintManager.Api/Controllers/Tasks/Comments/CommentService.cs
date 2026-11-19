using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks.Comments;

/// <summary>Comments on a task.</summary>
public sealed class CommentService(ICommentRepository comments, TaskAccess taskAccess, IClock clock)
{
    /// <summary>Adds a comment (any member of the project).</summary>
    public async Task<OperationResult<Comment>> AddAsync(TaskId id, CommentRequest request, CurrentUser caller, CancellationToken ct)
    {
        var loaded = await taskAccess.AsMemberAsync(id, caller, ct);
        if (!loaded.IsSuccess)
            return OperationResult<Comment>.Fail(loaded.Error!.Value);

        var comment = new Comment(Guid.NewGuid(), id, caller.Id, request.Text.Trim(), clock.UtcNow);
        await comments.AddAsync(comment, ct);
        return OperationResult<Comment>.Ok(comment);
    }

    /// <summary>Deletes own comment (or any, for managers).</summary>
    public async Task<OperationResult<bool>> DeleteAsync(TaskId id, Guid commentId, CurrentUser caller, CancellationToken ct)
    {
        var loaded = await taskAccess.AsMemberAsync(id, caller, ct);
        if (!loaded.IsSuccess)
            return OperationResult<bool>.Fail(loaded.Error!.Value);

        var existing = (await comments.GetForTaskAsync(id, ct)).FirstOrDefault(c => c.Id == commentId);
        if (existing is null)
            return OperationResult.NotFound<bool>("Comment");
        if (existing.AuthorId != caller.Id && !caller.IsManager)
            return OperationResult.Forbidden<bool>("You can only delete your own comments.");

        return OperationResult<bool>.Ok(await comments.DeleteAsync(commentId, ct));
    }
}
