using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Dashboard;

/// <summary>Point on a burndown line.</summary>
public sealed record BurndownPointDto(DateOnly Date, double RemainingHours);

/// <summary>Sprint dashboard.</summary>
public sealed record DashboardDto(
    Guid SprintId,
    string SprintName,
    SprintStatus Status,
    double TotalHours,
    double CompletedHours,
    double ProgressPercent,
    int DaysLeft,
    DateOnly? ForecastFinishDate,
    bool IsOnTrack,
    double VelocityHoursPerDay,
    string VelocitySource,
    IReadOnlyList<BurndownPointDto> Ideal,
    IReadOnlyList<BurndownPointDto> Actual,
    IReadOnlyList<BurndownPointDto> Forecast,
    IReadOnlyList<MemberWorkloadDto> Workload,
    IReadOnlyList<AtRiskTaskDto> AtRisk,
    IReadOnlyList<Guid> CriticalPath);

/// <summary>Assigned versus capacity versus done, per member.</summary>
public sealed record MemberWorkloadDto(Guid MemberId, string Name, double AssignedHours, double CapacityHours, double CompletedHours, double LoadPercent);

/// <summary>A task that needs attention and why.</summary>
public sealed record AtRiskTaskDto(Guid TaskId, string Title, Guid? AssigneeId, string Reason, bool IsCritical);
