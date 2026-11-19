using SprintManager.Core.Domain;
using SprintManager.Data.Documents;
using SprintManager.Data.Serialization;

namespace SprintManager.Data.Mappers;

/// <summary>Explicit, compile-time checked mappings between documents and Core records.</summary>
public static class DocumentMappers
{
    // ---- User ---------------------------------------------------------------

    /// <summary>Document to domain.</summary>
    public static User ToDomain(this UserDocument d) => new(
        new MemberId(d.Id),
        new EmailAddress(d.Email),
        d.PasswordHash,
        d.Name,
        Enum.Parse<UserRole>(d.Role),
        d.Skills.ToDictionary(kv => kv.Key, kv => new SkillLevel(kv.Value), StringComparer.OrdinalIgnoreCase),
        new Hours(d.WeeklyCapacityHours),
        new DateTimeOffset(DateTime.SpecifyKind(d.CreatedAt, DateTimeKind.Utc)));

    /// <summary>Domain to document.</summary>
    public static UserDocument ToDocument(this User u) => new()
    {
        Id = u.Id.Value,
        Email = u.Email.Value,
        PasswordHash = u.PasswordHash,
        Name = u.Name,
        Role = u.Role.ToString(),
        Skills = u.Skills.ToDictionary(kv => kv.Key, kv => kv.Value.Value),
        WeeklyCapacityHours = u.WeeklyCapacity.Value,
        CreatedAt = u.CreatedAt.UtcDateTime,
    };

    // ---- Project --------------------------------------------------------------

    /// <summary>Document to domain.</summary>
    public static Project ToDomain(this ProjectDocument d) => new(
        new ProjectId(d.Id),
        d.Name,
        d.Description,
        new MemberId(d.OwnerId),
        d.MemberIds.Select(id => new MemberId(id)).ToList(),
        d.IsArchived,
        new DateTimeOffset(DateTime.SpecifyKind(d.CreatedAt, DateTimeKind.Utc)),
        d.WipLimits.ToDictionary(kv => Enum.Parse<WorkItemStatus>(kv.Key), kv => kv.Value));

    /// <summary>Domain to document.</summary>
    public static ProjectDocument ToDocument(this Project p) => new()
    {
        Id = p.Id.Value,
        Name = p.Name,
        Description = p.Description,
        OwnerId = p.OwnerId.Value,
        MemberIds = p.MemberIds.Select(m => m.Value).ToList(),
        IsArchived = p.IsArchived,
        CreatedAt = p.CreatedAt.UtcDateTime,
        WipLimits = p.WipLimits?.ToDictionary(kv => kv.Key.ToString(), kv => kv.Value) ?? new(),
    };

    // ---- Sprint ---------------------------------------------------------------

    /// <summary>Document to domain.</summary>
    public static Sprint ToDomain(this SprintDocument d) => new(
        new SprintId(d.Id),
        new ProjectId(d.ProjectId),
        d.Name,
        d.StartDate,
        d.EndDate,
        Enum.Parse<SprintStatus>(d.Status),
        new DateTimeOffset(DateTime.SpecifyKind(d.CreatedAt, DateTimeKind.Utc)));

    /// <summary>Domain to document.</summary>
    public static SprintDocument ToDocument(this Sprint s) => new()
    {
        Id = s.Id.Value,
        ProjectId = s.ProjectId.Value,
        Name = s.Name,
        StartDate = s.StartDate,
        EndDate = s.EndDate,
        Status = s.Status.ToString(),
        CreatedAt = s.CreatedAt.UtcDateTime,
    };

    // ---- Task -----------------------------------------------------------------

    /// <summary>Document to domain.</summary>
    public static TaskItem ToDomain(this TaskDocument d) => new(
        new TaskId(d.Id),
        new ProjectId(d.ProjectId),
        d.SprintId is { } s ? new SprintId(s) : null,
        d.Title,
        d.Description,
        new Hours(d.EstimateHours),
        d.Deadline,
        Enum.Parse<WorkItemStatus>(d.Status),
        d.AssigneeId is { } a ? new MemberId(a) : null,
        d.RequiredSkills,
        d.DependsOn.Select(id => new TaskId(id)).ToList(),
        new DateTimeOffset(DateTime.SpecifyKind(d.CreatedAt, DateTimeKind.Utc)),
        new DateTimeOffset(DateTime.SpecifyKind(d.UpdatedAt, DateTimeKind.Utc)),
        d.CompletedAt is { } c ? new DateTimeOffset(DateTime.SpecifyKind(c, DateTimeKind.Utc)) : null,
        d.Type is { } type ? Enum.Parse<TaskType>(type) : null);

    /// <summary>Domain to document.</summary>
    public static TaskDocument ToDocument(this TaskItem t) => new()
    {
        Id = t.Id.Value,
        ProjectId = t.ProjectId.Value,
        SprintId = t.SprintId?.Value,
        Title = t.Title,
        Description = t.Description,
        EstimateHours = t.Estimate.Value,
        Deadline = t.Deadline,
        Status = t.Status.ToString(),
        AssigneeId = t.AssigneeId?.Value,
        RequiredSkills = t.RequiredSkills.ToList(),
        DependsOn = t.DependsOn.Select(d => d.Value).ToList(),
        CreatedAt = t.CreatedAt.UtcDateTime,
        UpdatedAt = t.UpdatedAt.UtcDateTime,
        CompletedAt = t.CompletedAt?.UtcDateTime,
        Type = t.Type?.ToString(),
    };

    // ---- PlanJob --------------------------------------------------------------

    /// <summary>Document to domain.</summary>
    public static PlanJob ToDomain(this PlanJobDocument d) => new(
        new JobId(d.Id),
        new SprintId(d.SprintId),
        new ProjectId(d.ProjectId),
        new MemberId(d.RequestedBy),
        d.StrategyName,
        Enum.Parse<PlanJobStatus>(d.Status),
        new DateTimeOffset(DateTime.SpecifyKind(d.CreatedAt, DateTimeKind.Utc)),
        d.StartedAt is { } s ? new DateTimeOffset(DateTime.SpecifyKind(s, DateTimeKind.Utc)) : null,
        d.FinishedAt is { } f ? new DateTimeOffset(DateTime.SpecifyKind(f, DateTimeKind.Utc)) : null,
        d.ResultJson is { } json ? PlanJson.Deserialize(json) : null,
        d.Error);

    /// <summary>Domain to document.</summary>
    public static PlanJobDocument ToDocument(this PlanJob j) => new()
    {
        Id = j.Id.Value,
        SprintId = j.SprintId.Value,
        ProjectId = j.ProjectId.Value,
        RequestedBy = j.RequestedBy.Value,
        StrategyName = j.StrategyName,
        Status = j.Status.ToString(),
        CreatedAt = j.CreatedAt.UtcDateTime,
        StartedAt = j.StartedAt?.UtcDateTime,
        FinishedAt = j.FinishedAt?.UtcDateTime,
        ResultJson = j.Result is { } r ? PlanJson.Serialize(r) : null,
        Error = j.Error,
    };
}
