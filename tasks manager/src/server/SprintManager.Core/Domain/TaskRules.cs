namespace SprintManager.Core.Domain;

/// <summary>Why a status change was refused.</summary>
public enum StatusChangeError
{
    /// <summary>Same status as now.</summary>
    NoChange,
    /// <summary>Cannot start or finish while a prerequisite is not done.</summary>
    DependenciesUnfinished,
    /// <summary>Transition not allowed by the board rules.</summary>
    InvalidTransition,
}

/// <summary>Outcome of a status change check.</summary>
public sealed record StatusChangeResult
{
    /// <summary>Allowed.</summary>
    public bool IsAllowed { get; private init; }

    /// <summary>Reason when refused.</summary>
    public StatusChangeError? Error { get; private init; }

    /// <summary>Prerequisites that are still open (for the UI's "waiting for" list).</summary>
    public IReadOnlyList<TaskId> BlockingTaskIds { get; private init; } = [];

    /// <summary>Allowed.</summary>
    public static StatusChangeResult Allowed() => new() { IsAllowed = true };

    /// <summary>Refused.</summary>
    public static StatusChangeResult Refused(StatusChangeError error, IReadOnlyList<TaskId>? blocking = null) =>
        new() { IsAllowed = false, Error = error, BlockingTaskIds = blocking ?? [] };
}

/// <summary>Board rules shared by the API and (through the DTOs) the client.</summary>
public static class TaskRules
{
    /// <summary>
    /// Checks whether a task may move to <paramref name="next"/>.
    /// Rules: any status may go back to ToDo or on to InQA; InProgress and Done require every prerequisite
    /// in <paramref name="prerequisites"/> to be Done. The service currently passes none, so a task moves freely.
    /// </summary>
    public static StatusChangeResult CanChangeStatus(TaskItem task, WorkItemStatus next, IReadOnlyList<TaskItem> prerequisites)
    {
        ArgumentNullException.ThrowIfNull(task);
        if (task.Status == next)
            return StatusChangeResult.Refused(StatusChangeError.NoChange);

        if (next is WorkItemStatus.ToDo or WorkItemStatus.InQA)
            return StatusChangeResult.Allowed();

        var open = prerequisites.Where(p => p.Status is not WorkItemStatus.Done).Select(p => p.Id).ToList();
        return open.Count == 0
            ? StatusChangeResult.Allowed()
            : StatusChangeResult.Refused(StatusChangeError.DependenciesUnfinished, open);
    }

    /// <summary>Ids of prerequisites that are not done: what a task is waiting for.</summary>
    public static IReadOnlyList<TaskId> OpenPrerequisites(TaskItem task, IReadOnlyDictionary<TaskId, TaskItem> byId) =>
        task.DependsOn.Where(d => byId.TryGetValue(d, out var p) && p.Status is not WorkItemStatus.Done).ToList();

    /// <summary>
    /// Checks that adding <paramref name="newDependsOn"/> to <paramref name="taskId"/> does not create a cycle
    /// among <paramref name="projectTasks"/>. Walks from each new prerequisite backwards through its own
    /// prerequisites; reaching <paramref name="taskId"/> means a cycle. O(V + E).
    /// </summary>
    public static bool WouldCreateCycle(TaskId taskId, IReadOnlyList<TaskId> newDependsOn, IReadOnlyList<TaskItem> projectTasks)
    {
        var dependsOn = projectTasks.ToDictionary(t => t.Id, t => t.DependsOn);
        var seen = new HashSet<TaskId>();
        var stack = new Stack<TaskId>(newDependsOn);
        while (stack.Count > 0)
        {
            var current = stack.Pop();
            if (current == taskId)
                return true;
            if (!seen.Add(current) || !dependsOn.TryGetValue(current, out var next))
                continue;
            foreach (var n in next)
                stack.Push(n);
        }
        return false;
    }
}
