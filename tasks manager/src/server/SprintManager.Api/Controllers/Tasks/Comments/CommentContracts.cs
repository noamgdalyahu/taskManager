using System.ComponentModel.DataAnnotations;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks.Comments;

/// <summary>Comment.</summary>
public sealed record CommentDto(Guid Id, Guid AuthorId, string Text, DateTimeOffset CreatedAt);

/// <summary>Add a comment.</summary>
public sealed record CommentRequest([Required, MinLength(1), MaxLength(4000)] string Text);

/// <summary>Explicit mapping for comments.</summary>
public static class CommentMapping
{
    /// <summary>Comment to DTO.</summary>
    public static CommentDto ToDto(this Comment c) => new(c.Id, c.AuthorId.Value, c.Text, c.CreatedAt);
}
