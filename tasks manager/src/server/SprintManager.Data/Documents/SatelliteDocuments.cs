using MongoDB.Bson.Serialization.Attributes;

namespace SprintManager.Data.Documents;

/// <summary>timeLogs collection document.</summary>
public sealed class TimeLogDocument
{
    /// <summary>Primary key.</summary>
    [BsonId] public Guid Id { get; set; }
    /// <summary>Task id (indexed).</summary>
    public Guid TaskId { get; set; }
    /// <summary>Member id.</summary>
    public Guid MemberId { get; set; }
    /// <summary>Hours.</summary>
    public double Hours { get; set; }
    /// <summary>Day.</summary>
    public DateOnly Date { get; set; }
    /// <summary>Note.</summary>
    public string? Note { get; set; }
}

/// <summary>comments collection document.</summary>
public sealed class CommentDocument
{
    /// <summary>Primary key.</summary>
    [BsonId] public Guid Id { get; set; }
    /// <summary>Task id (indexed).</summary>
    public Guid TaskId { get; set; }
    /// <summary>Author id.</summary>
    public Guid AuthorId { get; set; }
    /// <summary>Text.</summary>
    public string Text { get; set; } = "";
    /// <summary>Created.</summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>history collection document.</summary>
public sealed class HistoryDocument
{
    /// <summary>Primary key.</summary>
    [BsonId] public Guid Id { get; set; }
    /// <summary>Task id (indexed).</summary>
    public Guid TaskId { get; set; }
    /// <summary>Actor id.</summary>
    public Guid ChangedBy { get; set; }
    /// <summary>Field name.</summary>
    public string Field { get; set; } = "";
    /// <summary>Before.</summary>
    public string? OldValue { get; set; }
    /// <summary>After.</summary>
    public string? NewValue { get; set; }
    /// <summary>When.</summary>
    public DateTime At { get; set; }
}

/// <summary>invitations collection document.</summary>
public sealed class InvitationDocument
{
    /// <summary>Primary key.</summary>
    [BsonId] public Guid Id { get; set; }
    /// <summary>Project id.</summary>
    public Guid ProjectId { get; set; }
    /// <summary>Code (unique index).</summary>
    public string Code { get; set; } = "";
    /// <summary>Email restriction.</summary>
    public string? Email { get; set; }
    /// <summary>Expiry.</summary>
    public DateTime ExpiresAt { get; set; }
    /// <summary>Redeemer id.</summary>
    public Guid? UsedBy { get; set; }
}
