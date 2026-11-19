using System.ComponentModel.DataAnnotations;
using SprintManager.Api.Controllers.Tasks.Comments;
using SprintManager.Api.Controllers.Tasks.TimeLogs;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks;

/// <summary>Create a task in a project's backlog.</summary>
public sealed record CreateTaskRequest(
    [Required, MinLength(1), MaxLength(200)] string Title,
    [MaxLength(5000)] string? Description,
    [Range(0, 1000)] double EstimateHours,
    DateOnly? Deadline,
    IReadOnlyList<string>? RequiredSkills,
    IReadOnlyList<Guid>? DependsOn,
    Guid? SprintId);

/// <summary>Manager edit of a task (all fields replaceable).</summary>
public sealed record UpdateTaskRequest(
    [Required, MinLength(1), MaxLength(200)] string Title,
    [MaxLength(5000)] string? Description,
    [Range(0, 1000)] double EstimateHours,
    DateOnly? Deadline,
    IReadOnlyList<string>? RequiredSkills,
    IReadOnlyList<Guid>? DependsOn,
    Guid? SprintId,
    Guid? AssigneeId);

/// <summary>Status change (member or manager).</summary>
public sealed record ChangeStatusRequest([Required] WorkItemStatus Status);

/// <summary>Assignee change (manager).</summary>
public sealed record AssignRequest(Guid? AssigneeId);

/// <summary>Task as shown on lists and boards.</summary>
public sealed record TaskDto(
    Guid Id, Guid ProjectId, Guid? SprintId, string Title, string Description, double EstimateHours, DateOnly? Deadline,
    WorkItemStatus Status, Guid? AssigneeId, IReadOnlyList<string> RequiredSkills, IReadOnlyList<Guid> DependsOn,
    IReadOnlyList<Guid> WaitingFor, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, DateTimeOffset? CompletedAt);

/// <summary>Task detail page.</summary>
public sealed record TaskDetailDto(TaskDto Task, IReadOnlyList<CommentDto> Comments, IReadOnlyList<HistoryDto> History, IReadOnlyList<TimeLogDto> TimeLogs, double LoggedHours);

/// <summary>History entry.</summary>
public sealed record HistoryDto(Guid Id, Guid ChangedBy, string Field, string? OldValue, string? NewValue, DateTimeOffset At);
