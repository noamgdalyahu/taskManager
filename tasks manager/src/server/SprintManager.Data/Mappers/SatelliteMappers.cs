using SprintManager.Core.Domain;
using SprintManager.Data.Documents;

namespace SprintManager.Data.Mappers;

/// <summary>Mappings for time logs, comments, history and invitations.</summary>
public static class SatelliteMappers
{
    private static DateTimeOffset Utc(DateTime d) => new(DateTime.SpecifyKind(d, DateTimeKind.Utc));

    /// <summary>Document to domain.</summary>
    public static TimeLog ToDomain(this TimeLogDocument d) => new(d.Id, new TaskId(d.TaskId), new MemberId(d.MemberId), new Hours(d.Hours), d.Date, d.Note);

    /// <summary>Domain to document.</summary>
    public static TimeLogDocument ToDocument(this TimeLog l) => new() { Id = l.Id, TaskId = l.TaskId.Value, MemberId = l.MemberId.Value, Hours = l.Hours.Value, Date = l.Date, Note = l.Note };

    /// <summary>Document to domain.</summary>
    public static Comment ToDomain(this CommentDocument d) => new(d.Id, new TaskId(d.TaskId), new MemberId(d.AuthorId), d.Text, Utc(d.CreatedAt));

    /// <summary>Domain to document.</summary>
    public static CommentDocument ToDocument(this Comment c) => new() { Id = c.Id, TaskId = c.TaskId.Value, AuthorId = c.AuthorId.Value, Text = c.Text, CreatedAt = c.CreatedAt.UtcDateTime };

    /// <summary>Document to domain.</summary>
    public static HistoryEntry ToDomain(this HistoryDocument d) => new(d.Id, new TaskId(d.TaskId), new MemberId(d.ChangedBy), d.Field, d.OldValue, d.NewValue, Utc(d.At));

    /// <summary>Domain to document.</summary>
    public static HistoryDocument ToDocument(this HistoryEntry h) => new() { Id = h.Id, TaskId = h.TaskId.Value, ChangedBy = h.ChangedBy.Value, Field = h.Field, OldValue = h.OldValue, NewValue = h.NewValue, At = h.At.UtcDateTime };

    /// <summary>Document to domain.</summary>
    public static Invitation ToDomain(this InvitationDocument d) => new(d.Id, new ProjectId(d.ProjectId), d.Code, d.Email is { } e ? new EmailAddress(e) : null, Utc(d.ExpiresAt), d.UsedBy is { } u ? new MemberId(u) : null);

    /// <summary>Domain to document.</summary>
    public static InvitationDocument ToDocument(this Invitation i) => new() { Id = i.Id, ProjectId = i.ProjectId.Value, Code = i.Code, Email = i.Email?.Value, ExpiresAt = i.ExpiresAt.UtcDateTime, UsedBy = i.UsedBy?.Value };
}
