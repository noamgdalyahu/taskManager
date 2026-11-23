using MongoDB.Driver;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;
using SprintManager.Data.Documents;
using SprintManager.Data.Mappers;

namespace SprintManager.Data.Repositories;

/// <summary>Mongo implementation of <see cref="IUserRepository"/>.</summary>
public sealed class MongoUserRepository(MongoContext db) : IUserRepository
{
    /// <inheritdoc />
    public async Task<User?> GetAsync(MemberId id, CancellationToken ct = default) =>
        (await db.Users.Find(u => u.Id == id.Value).FirstOrDefaultAsync(ct))?.ToDomain();

    /// <inheritdoc />
    public async Task<User?> GetByEmailAsync(EmailAddress email, CancellationToken ct = default) =>
        (await db.Users.Find(u => u.Email == email.Value).FirstOrDefaultAsync(ct))?.ToDomain();

    /// <inheritdoc />
    public async Task<IReadOnlyList<User>> GetManyAsync(IReadOnlyCollection<MemberId> ids, CancellationToken ct = default)
    {
        if (ids.Count == 0)
            return [];
        var raw = ids.Select(i => i.Value).ToList();
        var docs = await db.Users.Find(Builders<UserDocument>.Filter.In(u => u.Id, raw)).ToListAsync(ct);

        // MongoDB returns an $in query in natural order, which is not stable. Restore the requested order so that
        // callers (notably the planner, which breaks ties by member order) are deterministic.
        var position = raw.Select((id, i) => (id, i)).ToDictionary(x => x.id, x => x.i);
        return docs.OrderBy(d => position[d.Id]).Select(d => d.ToDomain()).ToList();
    }

    /// <inheritdoc />
    public Task AddAsync(User user, CancellationToken ct = default) =>
        db.Users.InsertOneAsync(user.ToDocument(), cancellationToken: ct);

    /// <inheritdoc />
    public Task UpdateAsync(User user, CancellationToken ct = default) =>
        db.Users.ReplaceOneAsync(u => u.Id == user.Id.Value, user.ToDocument(), cancellationToken: ct);
}

/// <summary>Mongo implementation of <see cref="IProjectRepository"/>.</summary>
public sealed class MongoProjectRepository(MongoContext db) : IProjectRepository
{
    /// <inheritdoc />
    public async Task<Project?> GetAsync(ProjectId id, CancellationToken ct = default) =>
        (await db.Projects.Find(p => p.Id == id.Value).FirstOrDefaultAsync(ct))?.ToDomain();

    /// <inheritdoc />
    public async Task<IReadOnlyList<Project>> GetForMemberAsync(MemberId memberId, bool includeArchived, CancellationToken ct = default)
    {
        var filter = Builders<ProjectDocument>.Filter.AnyEq(p => p.MemberIds, memberId.Value);
        if (!includeArchived)
            filter &= Builders<ProjectDocument>.Filter.Eq(p => p.IsArchived, false);
        var docs = await db.Projects.Find(filter).SortByDescending(p => p.CreatedAt).ToListAsync(ct);
        return docs.Select(d => d.ToDomain()).ToList();
    }

    /// <inheritdoc />
    public Task AddAsync(Project project, CancellationToken ct = default) =>
        db.Projects.InsertOneAsync(project.ToDocument(), cancellationToken: ct);

    /// <inheritdoc />
    public Task UpdateAsync(Project project, CancellationToken ct = default) =>
        db.Projects.ReplaceOneAsync(p => p.Id == project.Id.Value, project.ToDocument(), cancellationToken: ct);
}

/// <summary>Mongo implementation of <see cref="ISprintRepository"/>.</summary>
public sealed class MongoSprintRepository(MongoContext db) : ISprintRepository
{
    /// <inheritdoc />
    public async Task<Sprint?> GetAsync(SprintId id, CancellationToken ct = default) =>
        (await db.Sprints.Find(s => s.Id == id.Value).FirstOrDefaultAsync(ct))?.ToDomain();

    /// <inheritdoc />
    public async Task<IReadOnlyList<Sprint>> GetForProjectAsync(ProjectId projectId, CancellationToken ct = default)
    {
        var docs = await db.Sprints.Find(s => s.ProjectId == projectId.Value).SortByDescending(s => s.StartDate).ToListAsync(ct);
        return docs.Select(d => d.ToDomain()).ToList();
    }

    /// <inheritdoc />
    public Task AddAsync(Sprint sprint, CancellationToken ct = default) =>
        db.Sprints.InsertOneAsync(sprint.ToDocument(), cancellationToken: ct);

    /// <inheritdoc />
    public Task UpdateAsync(Sprint sprint, CancellationToken ct = default) =>
        db.Sprints.ReplaceOneAsync(s => s.Id == sprint.Id.Value, sprint.ToDocument(), cancellationToken: ct);
}

/// <summary>Mongo implementation of <see cref="ITaskRepository"/>.</summary>
public sealed class MongoTaskRepository(MongoContext db) : ITaskRepository
{
    /// <inheritdoc />
    public async Task<TaskItem?> GetAsync(TaskId id, CancellationToken ct = default) =>
        (await db.Tasks.Find(t => t.Id == id.Value).FirstOrDefaultAsync(ct))?.ToDomain();

    /// <inheritdoc />
    public async Task<IReadOnlyList<TaskItem>> GetManyAsync(IReadOnlyCollection<TaskId> ids, CancellationToken ct = default)
    {
        if (ids.Count == 0)
            return [];
        var raw = ids.Select(i => i.Value).ToList();
        return await ListAsync(Builders<TaskDocument>.Filter.In(t => t.Id, raw), ct);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<TaskItem>> GetForProjectAsync(ProjectId projectId, CancellationToken ct = default) =>
        ListAsync(Builders<TaskDocument>.Filter.Eq(t => t.ProjectId, projectId.Value), ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<TaskItem>> GetForSprintAsync(SprintId sprintId, CancellationToken ct = default) =>
        ListAsync(Builders<TaskDocument>.Filter.Eq(t => t.SprintId, sprintId.Value), ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<TaskItem>> GetForAssigneeAsync(MemberId memberId, CancellationToken ct = default) =>
        ListAsync(Builders<TaskDocument>.Filter.Eq(t => t.AssigneeId, memberId.Value), ct);

    /// <inheritdoc />
    public Task AddAsync(TaskItem task, CancellationToken ct = default) =>
        db.Tasks.InsertOneAsync(task.ToDocument(), cancellationToken: ct);

    /// <inheritdoc />
    public Task UpdateAsync(TaskItem task, CancellationToken ct = default) =>
        db.Tasks.ReplaceOneAsync(t => t.Id == task.Id.Value, task.ToDocument(), cancellationToken: ct);

    /// <inheritdoc />
    public Task DeleteAsync(TaskId id, CancellationToken ct = default) =>
        db.Tasks.DeleteOneAsync(t => t.Id == id.Value, ct);

    /// <inheritdoc />
    public Task UpdateManyAsync(IReadOnlyCollection<TaskItem> tasks, CancellationToken ct = default)
    {
        if (tasks.Count == 0)
            return Task.CompletedTask;
        var writes = tasks
            .Select(t => new ReplaceOneModel<TaskDocument>(Builders<TaskDocument>.Filter.Eq(d => d.Id, t.Id.Value), t.ToDocument()))
            .ToList();
        return db.Tasks.BulkWriteAsync(writes, cancellationToken: ct);
    }

    private async Task<IReadOnlyList<TaskItem>> ListAsync(FilterDefinition<TaskDocument> filter, CancellationToken ct)
    {
        var docs = await db.Tasks.Find(filter).SortBy(t => t.CreatedAt).ToListAsync(ct);
        return docs.Select(d => d.ToDomain()).ToList();
    }
}

/// <summary>Mongo implementation of <see cref="IPlanJobRepository"/>.</summary>
public sealed class MongoPlanJobRepository(MongoContext db) : IPlanJobRepository
{
    /// <inheritdoc />
    public async Task<PlanJob?> GetAsync(JobId id, CancellationToken ct = default) =>
        (await db.PlanJobs.Find(j => j.Id == id.Value).FirstOrDefaultAsync(ct))?.ToDomain();

    /// <inheritdoc />
    public async Task<IReadOnlyList<PlanJob>> GetByStatusAsync(PlanJobStatus status, CancellationToken ct = default)
    {
        var name = status.ToString();
        var docs = await db.PlanJobs.Find(j => j.Status == name).SortBy(j => j.CreatedAt).ToListAsync(ct);
        return docs.Select(d => d.ToDomain()).ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PlanJob>> GetForSprintAsync(SprintId sprintId, int limit, CancellationToken ct = default)
    {
        var docs = await db.PlanJobs.Find(j => j.SprintId == sprintId.Value).SortByDescending(j => j.CreatedAt).Limit(limit).ToListAsync(ct);
        return docs.Select(d => d.ToDomain()).ToList();
    }

    /// <inheritdoc />
    public Task AddAsync(PlanJob job, CancellationToken ct = default) =>
        db.PlanJobs.InsertOneAsync(job.ToDocument(), cancellationToken: ct);

    /// <inheritdoc />
    public Task UpdateAsync(PlanJob job, CancellationToken ct = default) =>
        db.PlanJobs.ReplaceOneAsync(j => j.Id == job.Id.Value, job.ToDocument(), cancellationToken: ct);
}
