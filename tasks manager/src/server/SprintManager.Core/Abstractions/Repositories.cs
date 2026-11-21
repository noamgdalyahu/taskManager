using SprintManager.Core.Domain;

namespace SprintManager.Core.Abstractions;

/// <summary>Users and credentials.</summary>
public interface IUserRepository
{
    /// <summary>Finds a user by id.</summary>
    Task<User?> GetAsync(MemberId id, CancellationToken cancellationToken = default);

    /// <summary>Finds a user by normalised email.</summary>
    Task<User?> GetByEmailAsync(EmailAddress email, CancellationToken cancellationToken = default);

    /// <summary>Loads several users at once (team lookups), in the order of <paramref name="ids"/>; unknown ids are skipped.</summary>
    Task<IReadOnlyList<User>> GetManyAsync(IReadOnlyCollection<MemberId> ids, CancellationToken cancellationToken = default);

    /// <summary>Inserts a new user. Fails if the email exists.</summary>
    Task AddAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>Replaces an existing user.</summary>
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);
}

/// <summary>Projects and their teams.</summary>
public interface IProjectRepository
{
    /// <summary>Finds a project.</summary>
    Task<Project?> GetAsync(ProjectId id, CancellationToken cancellationToken = default);

    /// <summary>Projects a user belongs to.</summary>
    Task<IReadOnlyList<Project>> GetForMemberAsync(MemberId memberId, bool includeArchived, CancellationToken cancellationToken = default);

    /// <summary>Inserts.</summary>
    Task AddAsync(Project project, CancellationToken cancellationToken = default);

    /// <summary>Replaces.</summary>
    Task UpdateAsync(Project project, CancellationToken cancellationToken = default);
}

/// <summary>Sprints.</summary>
public interface ISprintRepository
{
    /// <summary>Finds a sprint.</summary>
    Task<Sprint?> GetAsync(SprintId id, CancellationToken cancellationToken = default);

    /// <summary>Sprints of a project, newest first.</summary>
    Task<IReadOnlyList<Sprint>> GetForProjectAsync(ProjectId projectId, CancellationToken cancellationToken = default);

    /// <summary>Inserts.</summary>
    Task AddAsync(Sprint sprint, CancellationToken cancellationToken = default);

    /// <summary>Replaces.</summary>
    Task UpdateAsync(Sprint sprint, CancellationToken cancellationToken = default);
}

/// <summary>Tasks.</summary>
public interface ITaskRepository
{
    /// <summary>Finds a task.</summary>
    Task<TaskItem?> GetAsync(TaskId id, CancellationToken cancellationToken = default);

    /// <summary>Loads several tasks at once.</summary>
    Task<IReadOnlyList<TaskItem>> GetManyAsync(IReadOnlyCollection<TaskId> ids, CancellationToken cancellationToken = default);

    /// <summary>All tasks of a project (backlog and sprints).</summary>
    Task<IReadOnlyList<TaskItem>> GetForProjectAsync(ProjectId projectId, CancellationToken cancellationToken = default);

    /// <summary>Tasks planned into a sprint.</summary>
    Task<IReadOnlyList<TaskItem>> GetForSprintAsync(SprintId sprintId, CancellationToken cancellationToken = default);

    /// <summary>Open or closed tasks assigned to a member across projects.</summary>
    Task<IReadOnlyList<TaskItem>> GetForAssigneeAsync(MemberId memberId, CancellationToken cancellationToken = default);

    /// <summary>Inserts.</summary>
    Task AddAsync(TaskItem task, CancellationToken cancellationToken = default);

    /// <summary>Replaces.</summary>
    Task UpdateAsync(TaskItem task, CancellationToken cancellationToken = default);

    /// <summary>Replaces several tasks (applying an accepted plan).</summary>
    Task UpdateManyAsync(IReadOnlyCollection<TaskItem> tasks, CancellationToken cancellationToken = default);

    /// <summary>Deletes a task. Its comments, time logs and history are removed by their own repositories.</summary>
    Task DeleteAsync(TaskId id, CancellationToken cancellationToken = default);
}

/// <summary>Time logs.</summary>
public interface ITimeLogRepository
{
    /// <summary>Logs of a task.</summary>
    Task<IReadOnlyList<TimeLog>> GetForTaskAsync(TaskId taskId, CancellationToken cancellationToken = default);

    /// <summary>Logs of several tasks (sprint reports).</summary>
    Task<IReadOnlyList<TimeLog>> GetForTasksAsync(IReadOnlyCollection<TaskId> taskIds, CancellationToken cancellationToken = default);

    /// <summary>Inserts.</summary>
    Task AddAsync(TimeLog log, CancellationToken cancellationToken = default);

    /// <summary>Deletes every log of a task (when the task is deleted).</summary>
    Task DeleteForTaskAsync(TaskId taskId, CancellationToken cancellationToken = default);
}

/// <summary>Comments.</summary>
public interface ICommentRepository
{
    /// <summary>Comments of a task, oldest first.</summary>
    Task<IReadOnlyList<Comment>> GetForTaskAsync(TaskId taskId, CancellationToken cancellationToken = default);

    /// <summary>Inserts.</summary>
    Task AddAsync(Comment comment, CancellationToken cancellationToken = default);

    /// <summary>Deletes by id; returns false when absent.</summary>
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Deletes every comment of a task (when the task is deleted).</summary>
    Task DeleteForTaskAsync(TaskId taskId, CancellationToken cancellationToken = default);
}

/// <summary>Audit history.</summary>
public interface IHistoryRepository
{
    /// <summary>History of a task, newest first.</summary>
    Task<IReadOnlyList<HistoryEntry>> GetForTaskAsync(TaskId taskId, CancellationToken cancellationToken = default);

    /// <summary>Appends entries.</summary>
    Task AddManyAsync(IReadOnlyCollection<HistoryEntry> entries, CancellationToken cancellationToken = default);

    /// <summary>Deletes the whole history of a task (when the task is deleted).</summary>
    Task DeleteForTaskAsync(TaskId taskId, CancellationToken cancellationToken = default);
}

/// <summary>Invitations.</summary>
public interface IInvitationRepository
{
    /// <summary>Finds by code.</summary>
    Task<Invitation?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    /// <summary>Inserts.</summary>
    Task AddAsync(Invitation invitation, CancellationToken cancellationToken = default);

    /// <summary>Replaces (marks used).</summary>
    Task UpdateAsync(Invitation invitation, CancellationToken cancellationToken = default);
}

/// <summary>Background planning jobs.</summary>
public interface IPlanJobRepository
{
    /// <summary>Finds a job.</summary>
    Task<PlanJob?> GetAsync(JobId id, CancellationToken cancellationToken = default);

    /// <summary>All jobs in a given status, oldest first (restart recovery).</summary>
    Task<IReadOnlyList<PlanJob>> GetByStatusAsync(PlanJobStatus status, CancellationToken cancellationToken = default);

    /// <summary>Latest jobs of a sprint, newest first.</summary>
    Task<IReadOnlyList<PlanJob>> GetForSprintAsync(SprintId sprintId, int limit, CancellationToken cancellationToken = default);

    /// <summary>Inserts.</summary>
    Task AddAsync(PlanJob job, CancellationToken cancellationToken = default);

    /// <summary>Replaces (status transitions).</summary>
    Task UpdateAsync(PlanJob job, CancellationToken cancellationToken = default);
}
