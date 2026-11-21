namespace SprintManager.Core.Domain;

/// <summary>Lifecycle state of a work item on the board.</summary>
public enum WorkItemStatus
{
    /// <summary>Not started.</summary>
    ToDo,
    /// <summary>Being worked on.</summary>
    InProgress,
    /// <summary>Built, and being checked by QA before it counts as done.</summary>
    InQA,
    /// <summary>Finished.</summary>
    Done,
}

/// <summary>What kind of work a task is. A task without a type (older data) is shown as untyped.</summary>
public enum TaskType
{
    /// <summary>Something is broken and needs fixing.</summary>
    Bug,
    /// <summary>A requirement describing something a user wants.</summary>
    UserStory,
    /// <summary>A specific piece of work to complete.</summary>
    Task,
    /// <summary>A large initiative containing multiple work items.</summary>
    Epic,
    /// <summary>A new capability or functionality.</summary>
    Feature,
    /// <summary>A problem, concern, or item requiring investigation.</summary>
    Issue,
    /// <summary>A defined scenario to verify functionality.</summary>
    TestCase,
    /// <summary>A general work request or support item.</summary>
    Ticket,
}

/// <summary>
/// The algorithmic view of a task: only the fields the planning algorithms need.
/// Persistence concerns (description, comments, timestamps) live outside Core.
/// </summary>
/// <param name="Id">Unique task id.</param>
/// <param name="Title">Short human readable title, used in warnings and reasons.</param>
/// <param name="Estimate">Estimated effort.</param>
/// <param name="DependsOn">Ids of tasks that must finish before this one can start (DAG edges).</param>
/// <param name="RequiredSkills">Skills a member needs to be eligible for this task.</param>
/// <param name="Deadline">Optional hard deadline.</param>
/// <param name="Status">Current board status.</param>
/// <param name="AssigneeId">Current assignee, if any.</param>
public sealed record WorkItem(
    TaskId Id,
    string Title,
    Hours Estimate,
    IReadOnlyList<TaskId> DependsOn,
    IReadOnlyList<string> RequiredSkills,
    DateOnly? Deadline = null,
    WorkItemStatus Status = WorkItemStatus.ToDo,
    MemberId? AssigneeId = null)
{
    /// <summary>True when the task is finished and no longer blocks anything.</summary>
    public bool IsDone => Status is WorkItemStatus.Done;
}
