using System.ComponentModel.DataAnnotations;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks.TimeLogs;

/// <summary>Time log.</summary>
public sealed record TimeLogDto(Guid Id, Guid MemberId, double Hours, DateOnly Date, string? Note);

/// <summary>Log time.</summary>
public sealed record TimeLogRequest([Range(0.25, 24)] double Hours, DateOnly? Date, [MaxLength(500)] string? Note);

/// <summary>Explicit mapping for time logs.</summary>
public static class TimeLogMapping
{
    /// <summary>Time log to DTO.</summary>
    public static TimeLogDto ToDto(this TimeLog l) => new(l.Id, l.MemberId.Value, l.Hours.Value, l.Date, l.Note);
}
