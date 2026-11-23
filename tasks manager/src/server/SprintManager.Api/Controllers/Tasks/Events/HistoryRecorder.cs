using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks.Events;

/// <summary>Observer that diffs the snapshots and appends one history entry per changed field.</summary>
public sealed class HistoryRecorder(IHistoryRepository history) : ITaskChangeObserver
{
    /// <inheritdoc />
    public Task OnTaskChangedAsync(TaskChanged change, CancellationToken ct)
    {
        var entries = Diff(change).ToList();
        return entries.Count == 0 ? Task.CompletedTask : history.AddManyAsync(entries, ct);
    }

    private static IEnumerable<HistoryEntry> Diff(TaskChanged c)
    {
        var (b, a) = (c.Before, c.After);
        HistoryEntry Entry(string field, string? oldValue, string? newValue) => new(Guid.NewGuid(), a.Id, c.By, field, oldValue, newValue, c.At);

        if (b is null)
        {
            yield return Entry("created", null, a.Title);
            yield break;
        }

        if (b.Title != a.Title) yield return Entry("title", b.Title, a.Title);
        if (b.Description != a.Description) yield return Entry("description", b.Description, a.Description);
        if (b.Status != a.Status) yield return Entry("status", b.Status.ToString(), a.Status.ToString());
        if (b.AssigneeId != a.AssigneeId) yield return Entry("assignee", b.AssigneeId?.ToString(), a.AssigneeId?.ToString());
        if (b.Estimate != a.Estimate) yield return Entry("estimate", b.Estimate.ToString(), a.Estimate.ToString());
        if (b.Deadline != a.Deadline) yield return Entry("deadline", b.Deadline?.ToString("yyyy-MM-dd"), a.Deadline?.ToString("yyyy-MM-dd"));
        if (b.SprintId != a.SprintId) yield return Entry("sprint", b.SprintId?.ToString(), a.SprintId?.ToString());
        if (!b.DependsOn.SequenceEqual(a.DependsOn)) yield return Entry("dependencies", Join(b.DependsOn), Join(a.DependsOn));
        if (b.Type != a.Type) yield return Entry("type", b.Type?.ToString(), a.Type?.ToString());
        if (!b.RequiredSkills.SequenceEqual(a.RequiredSkills)) yield return Entry("skills", string.Join(",", b.RequiredSkills), string.Join(",", a.RequiredSkills));
    }

    private static string Join(IReadOnlyList<TaskId> ids) => string.Join(",", ids.Select(i => i.Value));
}
