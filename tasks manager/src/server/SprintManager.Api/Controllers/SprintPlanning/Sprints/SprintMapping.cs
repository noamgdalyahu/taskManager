using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.SprintPlanning.Sprints;

/// <summary>Explicit mapping for sprints.</summary>
public static class SprintMapping
{
    /// <summary>Sprint view to DTO with derived numbers.</summary>
    public static SprintDto ToDto(this SprintView v) => new(
        v.Sprint.Id.Value, v.Sprint.ProjectId.Value, v.Sprint.Name, v.Sprint.StartDate, v.Sprint.EndDate, v.Sprint.Status,
        v.WorkingDays, v.TeamCapacityHours, v.Tasks.Count, v.Tasks.Sum(t => t.Estimate.Value));
}
