using SprintManager.Api.Jobs;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Tests.Support;

// In-memory implementations of the repository interfaces. They are deliberately naive (lists and dictionaries):
// the services are what is under test, not the storage.

public sealed class FakeClock : IClock
{
    public DateTimeOffset UtcNow { get; set; } = new(2026, 11, 16, 9, 0, 0, TimeSpan.Zero);
    public DateOnly Today => DateOnly.FromDateTime(UtcNow.UtcDateTime);
    public void Advance(TimeSpan by) => UtcNow += by;
}

public sealed class FakeUsers : IUserRepository
{
    public Dictionary<MemberId, User> Items { get; } = new();
    public Task<User?> GetAsync(MemberId id, CancellationToken ct = default) => Task.FromResult(Items.GetValueOrDefault(id));
    public Task<User?> GetByEmailAsync(EmailAddress email, CancellationToken ct = default) => Task.FromResult(Items.Values.FirstOrDefault(u => u.Email == email));
    public Task<IReadOnlyList<User>> GetManyAsync(IReadOnlyCollection<MemberId> ids, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<User>>(ids.Where(Items.ContainsKey).Select(i => Items[i]).ToList());
    public Task AddAsync(User user, CancellationToken ct = default) { Items[user.Id] = user; return Task.CompletedTask; }
    public Task UpdateAsync(User user, CancellationToken ct = default) { Items[user.Id] = user; return Task.CompletedTask; }
}

public sealed class FakeProjects : IProjectRepository
{
    public Dictionary<ProjectId, Project> Items { get; } = new();
    public Task<Project?> GetAsync(ProjectId id, CancellationToken ct = default) => Task.FromResult(Items.GetValueOrDefault(id));
    public Task<IReadOnlyList<Project>> GetForMemberAsync(MemberId memberId, bool includeArchived, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<Project>>(Items.Values.Where(p => p.HasMember(memberId) && (includeArchived || !p.IsArchived)).ToList());
    public Task AddAsync(Project project, CancellationToken ct = default) { Items[project.Id] = project; return Task.CompletedTask; }
    public Task UpdateAsync(Project project, CancellationToken ct = default) { Items[project.Id] = project; return Task.CompletedTask; }
}

public sealed class FakeSprints : ISprintRepository
{
    public Dictionary<SprintId, Sprint> Items { get; } = new();
    public Task<Sprint?> GetAsync(SprintId id, CancellationToken ct = default) => Task.FromResult(Items.GetValueOrDefault(id));
    public Task<IReadOnlyList<Sprint>> GetForProjectAsync(ProjectId projectId, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<Sprint>>(Items.Values.Where(s => s.ProjectId == projectId).OrderByDescending(s => s.StartDate).ToList());
    public Task AddAsync(Sprint sprint, CancellationToken ct = default) { Items[sprint.Id] = sprint; return Task.CompletedTask; }
    public Task UpdateAsync(Sprint sprint, CancellationToken ct = default) { Items[sprint.Id] = sprint; return Task.CompletedTask; }
}

public sealed class FakeTasks : ITaskRepository
{
    public Dictionary<TaskId, TaskItem> Items { get; } = new();
    public Task<TaskItem?> GetAsync(TaskId id, CancellationToken ct = default) => Task.FromResult(Items.GetValueOrDefault(id));
    public Task<IReadOnlyList<TaskItem>> GetManyAsync(IReadOnlyCollection<TaskId> ids, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<TaskItem>>(ids.Where(Items.ContainsKey).Select(i => Items[i]).ToList());
    public Task<IReadOnlyList<TaskItem>> GetForProjectAsync(ProjectId projectId, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<TaskItem>>(Items.Values.Where(t => t.ProjectId == projectId).ToList());
    public Task<IReadOnlyList<TaskItem>> GetForSprintAsync(SprintId sprintId, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<TaskItem>>(Items.Values.Where(t => t.SprintId == sprintId).ToList());
    public Task<IReadOnlyList<TaskItem>> GetForAssigneeAsync(MemberId memberId, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<TaskItem>>(Items.Values.Where(t => t.AssigneeId == memberId).ToList());
    public Task AddAsync(TaskItem task, CancellationToken ct = default) { Items[task.Id] = task; return Task.CompletedTask; }
    public Task UpdateAsync(TaskItem task, CancellationToken ct = default) { Items[task.Id] = task; return Task.CompletedTask; }
    public Task UpdateManyAsync(IReadOnlyCollection<TaskItem> tasks, CancellationToken ct = default) { foreach (var t in tasks) Items[t.Id] = t; return Task.CompletedTask; }
    public Task DeleteAsync(TaskId id, CancellationToken ct = default) { Items.Remove(id); return Task.CompletedTask; }
}

public sealed class FakeComments : ICommentRepository
{
    public List<Comment> Items { get; } = [];
    public Task<IReadOnlyList<Comment>> GetForTaskAsync(TaskId taskId, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<Comment>>(Items.Where(c => c.TaskId == taskId).OrderBy(c => c.CreatedAt).ToList());
    public Task AddAsync(Comment comment, CancellationToken ct = default) { Items.Add(comment); return Task.CompletedTask; }
    public Task<bool> DeleteAsync(Guid id, CancellationToken ct = default) => Task.FromResult(Items.RemoveAll(c => c.Id == id) > 0);
    public Task DeleteForTaskAsync(TaskId taskId, CancellationToken ct = default) { Items.RemoveAll(c => c.TaskId == taskId); return Task.CompletedTask; }
}

public sealed class FakeHistory : IHistoryRepository
{
    public List<HistoryEntry> Items { get; } = [];
    public Task<IReadOnlyList<HistoryEntry>> GetForTaskAsync(TaskId taskId, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<HistoryEntry>>(Items.Where(h => h.TaskId == taskId).OrderByDescending(h => h.At).ToList());
    public Task AddManyAsync(IReadOnlyCollection<HistoryEntry> entries, CancellationToken ct = default) { Items.AddRange(entries); return Task.CompletedTask; }
    public Task DeleteForTaskAsync(TaskId taskId, CancellationToken ct = default) { Items.RemoveAll(h => h.TaskId == taskId); return Task.CompletedTask; }
}

public sealed class FakeTimeLogs : ITimeLogRepository
{
    public List<TimeLog> Items { get; } = [];
    public Task<IReadOnlyList<TimeLog>> GetForTaskAsync(TaskId taskId, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<TimeLog>>(Items.Where(l => l.TaskId == taskId).ToList());
    public Task<IReadOnlyList<TimeLog>> GetForTasksAsync(IReadOnlyCollection<TaskId> taskIds, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<TimeLog>>(Items.Where(l => taskIds.Contains(l.TaskId)).ToList());
    public Task AddAsync(TimeLog log, CancellationToken ct = default) { Items.Add(log); return Task.CompletedTask; }
    public Task DeleteForTaskAsync(TaskId taskId, CancellationToken ct = default) { Items.RemoveAll(l => l.TaskId == taskId); return Task.CompletedTask; }
}

public sealed class FakeInvitations : IInvitationRepository
{
    public Dictionary<string, Invitation> Items { get; } = new();
    public Task<Invitation?> GetByCodeAsync(string code, CancellationToken ct = default) => Task.FromResult(Items.GetValueOrDefault(code));
    public Task AddAsync(Invitation invitation, CancellationToken ct = default) { Items[invitation.Code] = invitation; return Task.CompletedTask; }
    public Task UpdateAsync(Invitation invitation, CancellationToken ct = default) { Items[invitation.Code] = invitation; return Task.CompletedTask; }
}

public sealed class FakeJobs : IPlanJobRepository
{
    public Dictionary<JobId, PlanJob> Items { get; } = new();
    public Task<PlanJob?> GetAsync(JobId id, CancellationToken ct = default) => Task.FromResult(Items.GetValueOrDefault(id));
    public Task<IReadOnlyList<PlanJob>> GetByStatusAsync(PlanJobStatus status, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<PlanJob>>(Items.Values.Where(j => j.Status == status).OrderBy(j => j.CreatedAt).ToList());
    public Task<IReadOnlyList<PlanJob>> GetForSprintAsync(SprintId sprintId, int limit, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<PlanJob>>(Items.Values.Where(j => j.SprintId == sprintId).OrderByDescending(j => j.CreatedAt).Take(limit).ToList());
    public Task AddAsync(PlanJob job, CancellationToken ct = default) { Items[job.Id] = job; return Task.CompletedTask; }
    public Task UpdateAsync(PlanJob job, CancellationToken ct = default) { Items[job.Id] = job; return Task.CompletedTask; }
}

/// <summary>Queue fake that records what was enqueued and can pretend to be full.</summary>
public sealed class FakeQueue : IPlanJobQueue
{
    public List<JobId> Enqueued { get; } = [];
    public bool Full { get; set; }
    public bool TryEnqueue(JobId jobId) { if (Full) return false; Enqueued.Add(jobId); return true; }
    public ValueTask<JobId> DequeueAsync(CancellationToken cancellationToken) => throw new NotSupportedException();
    public int PendingCount => Enqueued.Count;
}

/// <summary>Cheap hasher so tests do not pay 210 000 PBKDF2 iterations per call.</summary>
public sealed class FakeHasher : IPasswordHasher
{
    public string Hash(string password) => "hash:" + password;
    public bool Verify(string password, string storedHash) => storedHash == "hash:" + password;
}
