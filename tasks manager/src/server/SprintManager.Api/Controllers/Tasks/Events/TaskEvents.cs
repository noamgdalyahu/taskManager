using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks.Events;

/// <summary>A task changed: the before and after snapshots and who did it.</summary>
/// <param name="Before">Previous state, null on creation.</param>
/// <param name="After">New state.</param>
/// <param name="By">Actor.</param>
/// <param name="At">When.</param>
public sealed record TaskChanged(TaskItem? Before, TaskItem After, MemberId By, DateTimeOffset At);

/// <summary>Receives task change events.</summary>
public interface ITaskChangeObserver
{
    /// <summary>Handles one change.</summary>
    Task OnTaskChangedAsync(TaskChanged change, CancellationToken ct);
}

/// <summary>
/// Observer pattern: services publish a change once; any number of observers react
/// (today: the history recorder; later: notifications, real-time board updates, PR links).
/// Publishing is awaited so the audit trail is written before the HTTP response returns.
/// </summary>
public sealed class TaskChangePublisher(IEnumerable<ITaskChangeObserver> observers)
{
    /// <summary>Notifies every observer.</summary>
    public async Task PublishAsync(TaskChanged change, CancellationToken ct)
    {
        foreach (var observer in observers)
            await observer.OnTaskChangedAsync(change, ct);
    }
}
