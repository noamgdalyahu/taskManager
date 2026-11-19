namespace SprintManager.Core.Domain;

/// <summary>
/// The persisted task. <see cref="WorkItem"/> is its projection for the algorithms;
/// this record carries everything the UI and the database need.
/// </summary>
/// <param name="Id">Identity.</param>
/// <param name="ProjectId">Owning project.</param>
/// <param name="SprintId">Sprint it is planned into, or null while in the backlog.</param>
/// <param name="Title">Title.</param>
/// <param name="Description">Free text.</param>
/// <param name="Estimate">Estimated effort.</param>
/// <param name="Deadline">Optional deadline.</param>
/// <param name="Status">Board status.</param>
/// <param name="AssigneeId">Assignee.</param>
/// <param name="RequiredSkills">Skills needed.</param>
/// <param name="DependsOn">Prerequisite tasks.</param>
/// <param name="CreatedAt">Creation time.</param>
/// <param name="UpdatedAt">Last change.</param>
/// <param name="CompletedAt">When it reached Done; feeds burndown.</param>
public sealed record TaskItem(
    TaskId Id,
    ProjectId ProjectId,
    SprintId? SprintId,
    string Title,
    string Description,
    Hours Estimate,
    DateOnly? Deadline,
    WorkItemStatus Status,
    MemberId? AssigneeId,
    IReadOnlyList<string> RequiredSkills,
    IReadOnlyList<TaskId> DependsOn,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? CompletedAt)
{
    /// <summary>Projection for the planning algorithms.</summary>
    public WorkItem ToWorkItem() => new(Id, Title, Estimate, DependsOn, RequiredSkills, Deadline, Status, AssigneeId);
}

/// <summary>Hours a member logged on a task.</summary>
/// <param name="Id">Identity.</param>
/// <param name="TaskId">Task.</param>
/// <param name="MemberId">Who.</param>
/// <param name="Hours">How much.</param>
/// <param name="Date">Which day.</param>
/// <param name="Note">Optional note.</param>
public sealed record TimeLog(Guid Id, TaskId TaskId, MemberId MemberId, Hours Hours, DateOnly Date, string? Note);

/// <summary>A comment on a task.</summary>
/// <param name="Id">Identity.</param>
/// <param name="TaskId">Task.</param>
/// <param name="AuthorId">Who.</param>
/// <param name="Text">Content.</param>
/// <param name="CreatedAt">When.</param>
public sealed record Comment(Guid Id, TaskId TaskId, MemberId AuthorId, string Text, DateTimeOffset CreatedAt);

/// <summary>An audit entry: one field change on a task.</summary>
/// <param name="Id">Identity.</param>
/// <param name="TaskId">Task.</param>
/// <param name="ChangedBy">Who.</param>
/// <param name="Field">Which field.</param>
/// <param name="OldValue">Before.</param>
/// <param name="NewValue">After.</param>
/// <param name="At">When.</param>
public sealed record HistoryEntry(Guid Id, TaskId TaskId, MemberId ChangedBy, string Field, string? OldValue, string? NewValue, DateTimeOffset At);
