using System.ComponentModel.DataAnnotations;

namespace SprintManager.Api.Controllers.Projects;

/// <summary>Create or update a project.</summary>
public sealed record ProjectRequest(
    [Required, MinLength(1), MaxLength(120)] string Name,
    [MaxLength(2000)] string? Description);

/// <summary>Project summary.</summary>
/// <param name="Id">Project id.</param>
/// <param name="Name">Name.</param>
/// <param name="Description">Description.</param>
/// <param name="OwnerId">The manager who created it.</param>
/// <param name="MemberCount">Team size.</param>
/// <param name="IsArchived">Hidden from active lists.</param>
/// <param name="CreatedAt">Creation time.</param>
/// <param name="WipLimits">Work-in-progress limit per board column, keyed by status name (ToDo, InProgress, InQA, Done). Missing: no limit.</param>
public sealed record ProjectDto(Guid Id, string Name, string Description, Guid OwnerId, int MemberCount, bool IsArchived, DateTimeOffset CreatedAt, IReadOnlyDictionary<string, int> WipLimits);

/// <summary>Set the work-in-progress limits of the board columns.</summary>
/// <param name="Limits">Status name to limit (1 to 99). Columns left out have no limit.</param>
public sealed record WipLimitsRequest(IReadOnlyDictionary<string, int>? Limits);
