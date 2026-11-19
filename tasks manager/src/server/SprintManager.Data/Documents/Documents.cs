using MongoDB.Bson.Serialization.Attributes;

namespace SprintManager.Data.Documents;

// Documents are the persistence shape: mutable, primitive-typed, BSON-attributed.
// They never leave the Data project; mappers convert to and from Core records.

/// <summary>users collection document.</summary>
public sealed class UserDocument
{
    /// <summary>Primary key.</summary>
    [BsonId] public Guid Id { get; set; }
    /// <summary>Normalised email, unique index.</summary>
    public string Email { get; set; } = "";
    /// <summary>Self-describing password hash.</summary>
    public string PasswordHash { get; set; } = "";
    /// <summary>Display name.</summary>
    public string Name { get; set; } = "";
    /// <summary>Role name.</summary>
    public string Role { get; set; } = "";
    /// <summary>Skill name to level.</summary>
    public Dictionary<string, int> Skills { get; set; } = new();
    /// <summary>Weekly capacity in hours.</summary>
    public double WeeklyCapacityHours { get; set; }
    /// <summary>Registration time.</summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>projects collection document.</summary>
public sealed class ProjectDocument
{
    /// <summary>Primary key.</summary>
    [BsonId] public Guid Id { get; set; }
    /// <summary>Name.</summary>
    public string Name { get; set; } = "";
    /// <summary>Description.</summary>
    public string Description { get; set; } = "";
    /// <summary>Owner user id.</summary>
    public Guid OwnerId { get; set; }
    /// <summary>Member user ids (indexed).</summary>
    public List<Guid> MemberIds { get; set; } = new();
    /// <summary>Archived flag.</summary>
    public bool IsArchived { get; set; }
    /// <summary>Creation time.</summary>
    public DateTime CreatedAt { get; set; }
    /// <summary>Work-in-progress limit per board column (status name to limit). Missing key: no limit.</summary>
    public Dictionary<string, int> WipLimits { get; set; } = new();
}

/// <summary>sprints collection document.</summary>
public sealed class SprintDocument
{
    /// <summary>Primary key.</summary>
    [BsonId] public Guid Id { get; set; }
    /// <summary>Project id (indexed).</summary>
    public Guid ProjectId { get; set; }
    /// <summary>Name.</summary>
    public string Name { get; set; } = "";
    /// <summary>First day.</summary>
    public DateOnly StartDate { get; set; }
    /// <summary>Last day.</summary>
    public DateOnly EndDate { get; set; }
    /// <summary>Status name.</summary>
    public string Status { get; set; } = "";
    /// <summary>Creation time.</summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>tasks collection document.</summary>
public sealed class TaskDocument
{
    /// <summary>Primary key.</summary>
    [BsonId] public Guid Id { get; set; }
    /// <summary>Project id (indexed).</summary>
    public Guid ProjectId { get; set; }
    /// <summary>Sprint id (indexed), null in backlog.</summary>
    public Guid? SprintId { get; set; }
    /// <summary>Title.</summary>
    public string Title { get; set; } = "";
    /// <summary>Description.</summary>
    public string Description { get; set; } = "";
    /// <summary>Estimate in hours.</summary>
    public double EstimateHours { get; set; }
    /// <summary>Deadline.</summary>
    public DateOnly? Deadline { get; set; }
    /// <summary>Status name.</summary>
    public string Status { get; set; } = "";
    /// <summary>Assignee user id (indexed).</summary>
    public Guid? AssigneeId { get; set; }
    /// <summary>Required skills.</summary>
    public List<string> RequiredSkills { get; set; } = new();
    /// <summary>Prerequisite task ids.</summary>
    public List<Guid> DependsOn { get; set; } = new();
    /// <summary>Creation time.</summary>
    public DateTime CreatedAt { get; set; }
    /// <summary>Last update.</summary>
    public DateTime UpdatedAt { get; set; }
    /// <summary>Completion time.</summary>
    public DateTime? CompletedAt { get; set; }
}

/// <summary>planJobs collection document.</summary>
public sealed class PlanJobDocument
{
    /// <summary>Primary key.</summary>
    [BsonId] public Guid Id { get; set; }
    /// <summary>Sprint id (indexed).</summary>
    public Guid SprintId { get; set; }
    /// <summary>Project id.</summary>
    public Guid ProjectId { get; set; }
    /// <summary>Requesting user id.</summary>
    public Guid RequestedBy { get; set; }
    /// <summary>Strategy name.</summary>
    public string StrategyName { get; set; } = "";
    /// <summary>Status name (indexed).</summary>
    public string Status { get; set; } = "";
    /// <summary>Enqueued.</summary>
    public DateTime CreatedAt { get; set; }
    /// <summary>Started.</summary>
    public DateTime? StartedAt { get; set; }
    /// <summary>Finished.</summary>
    public DateTime? FinishedAt { get; set; }
    /// <summary>Serialised <see cref="Core.Planning.SprintPlan"/> (JSON), null until done.</summary>
    public string? ResultJson { get; set; }
    /// <summary>Error message.</summary>
    public string? Error { get; set; }
}
