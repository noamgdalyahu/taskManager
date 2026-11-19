using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Reports;

/// <summary>One sprint in the history.</summary>
public sealed record SprintReportDto(
    Guid SprintId, string Name, DateOnly StartDate, DateOnly EndDate, SprintStatus Status,
    double PlannedHours, double CompletedHours, double LoggedHours, double EstimateAccuracyPercent, double VelocityHoursPerDay);

/// <summary>Estimate versus actual for one member across sprints.</summary>
public sealed record MemberReportDto(Guid MemberId, string Name, double CompletedEstimateHours, double LoggedHours, double AccuracyPercent, int TasksCompleted);

/// <summary>Project reports page.</summary>
public sealed record ReportsDto(IReadOnlyList<SprintReportDto> Sprints, IReadOnlyList<MemberReportDto> Members, double? AverageVelocityHoursPerDay);
