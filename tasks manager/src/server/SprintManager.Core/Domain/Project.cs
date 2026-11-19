namespace SprintManager.Core.Domain;

/// <summary>A project owned by a manager, with a team and a backlog.</summary>
/// <param name="Id">Identity.</param>
/// <param name="Name">Name.</param>
/// <param name="Description">Free text.</param>
/// <param name="OwnerId">The manager who created it.</param>
/// <param name="MemberIds">Team, owner included.</param>
/// <param name="IsArchived">Hidden from active lists.</param>
/// <param name="CreatedAt">Creation time.</param>
/// <param name="WipLimits">Work-in-progress limit per board column. A column that is not listed has no limit.</param>
public sealed record Project(
    ProjectId Id,
    string Name,
    string Description,
    MemberId OwnerId,
    IReadOnlyList<MemberId> MemberIds,
    bool IsArchived,
    DateTimeOffset CreatedAt,
    IReadOnlyDictionary<WorkItemStatus, int>? WipLimits = null)
{
    /// <summary>True when the user belongs to the team.</summary>
    public bool HasMember(MemberId id) => MemberIds.Contains(id);
}

/// <summary>Lifecycle of a sprint.</summary>
public enum SprintStatus
{
    /// <summary>Being planned.</summary>
    Planned,
    /// <summary>In progress.</summary>
    Active,
    /// <summary>Finished; feeds velocity.</summary>
    Closed,
}

/// <summary>A time-boxed iteration inside a project.</summary>
/// <param name="Id">Identity.</param>
/// <param name="ProjectId">Owning project.</param>
/// <param name="Name">Name, e.g. "Sprint 3".</param>
/// <param name="StartDate">First day.</param>
/// <param name="EndDate">Last day, inclusive.</param>
/// <param name="Status">Lifecycle.</param>
/// <param name="CreatedAt">Creation time.</param>
public sealed record Sprint(
    SprintId Id,
    ProjectId ProjectId,
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    SprintStatus Status,
    DateTimeOffset CreatedAt);

/// <summary>Invitation to join a project, redeemed by code.</summary>
/// <param name="Id">Identity.</param>
/// <param name="ProjectId">Target project.</param>
/// <param name="Code">Short random code.</param>
/// <param name="Email">Optional restriction to one email.</param>
/// <param name="ExpiresAt">Expiry.</param>
/// <param name="UsedBy">Who redeemed it, if anyone.</param>
public sealed record Invitation(
    Guid Id,
    ProjectId ProjectId,
    string Code,
    EmailAddress? Email,
    DateTimeOffset ExpiresAt,
    MemberId? UsedBy);
