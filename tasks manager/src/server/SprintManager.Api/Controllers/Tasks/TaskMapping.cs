using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks;

/// <summary>Explicit mappings for tasks and their history.</summary>
public static class TaskMapping
{
    /// <summary>Task to DTO; <paramref name="byId"/> resolves "waiting for".</summary>
    public static TaskDto ToDto(this TaskItem t, IReadOnlyDictionary<TaskId, TaskItem> byId) => new(
        t.Id.Value, t.ProjectId.Value, t.SprintId?.Value, t.Title, t.Description, t.Estimate.Value, t.Deadline,
        t.Status, t.AssigneeId?.Value, t.RequiredSkills, t.DependsOn.Select(d => d.Value).ToList(),
        TaskRules.OpenPrerequisites(t, byId).Select(d => d.Value).ToList(), t.CreatedAt, t.UpdatedAt, t.CompletedAt);

    /// <summary>History to DTO.</summary>
    public static HistoryDto ToDto(this HistoryEntry h) => new(h.Id, h.ChangedBy.Value, h.Field, h.OldValue, h.NewValue, h.At);
}
