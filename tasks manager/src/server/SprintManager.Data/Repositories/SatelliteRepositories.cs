using MongoDB.Driver;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;
using SprintManager.Data.Documents;
using SprintManager.Data.Mappers;

namespace SprintManager.Data.Repositories;

/// <summary>Mongo implementation of <see cref="ITimeLogRepository"/>.</summary>
public sealed class MongoTimeLogRepository(MongoContext db) : ITimeLogRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<TimeLog>> GetForTaskAsync(TaskId taskId, CancellationToken ct = default) =>
        (await db.TimeLogs.Find(l => l.TaskId == taskId.Value).SortBy(l => l.Date).ToListAsync(ct)).Select(d => d.ToDomain()).ToList();

    /// <inheritdoc />
    public async Task<IReadOnlyList<TimeLog>> GetForTasksAsync(IReadOnlyCollection<TaskId> taskIds, CancellationToken ct = default)
    {
        if (taskIds.Count == 0)
            return [];
        var raw = taskIds.Select(t => t.Value).ToList();
        return (await db.TimeLogs.Find(Builders<TimeLogDocument>.Filter.In(l => l.TaskId, raw)).ToListAsync(ct)).Select(d => d.ToDomain()).ToList();
    }

    /// <inheritdoc />
    public Task AddAsync(TimeLog log, CancellationToken ct = default) => db.TimeLogs.InsertOneAsync(log.ToDocument(), cancellationToken: ct);

    /// <inheritdoc />
    public Task DeleteForTaskAsync(TaskId taskId, CancellationToken ct = default) => db.TimeLogs.DeleteManyAsync(l => l.TaskId == taskId.Value, ct);
}

/// <summary>Mongo implementation of <see cref="ICommentRepository"/>.</summary>
public sealed class MongoCommentRepository(MongoContext db) : ICommentRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<Comment>> GetForTaskAsync(TaskId taskId, CancellationToken ct = default) =>
        (await db.Comments.Find(c => c.TaskId == taskId.Value).SortBy(c => c.CreatedAt).ToListAsync(ct)).Select(d => d.ToDomain()).ToList();

    /// <inheritdoc />
    public Task AddAsync(Comment comment, CancellationToken ct = default) => db.Comments.InsertOneAsync(comment.ToDocument(), cancellationToken: ct);

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default) =>
        (await db.Comments.DeleteOneAsync(c => c.Id == id, ct)).DeletedCount > 0;

    /// <inheritdoc />
    public Task DeleteForTaskAsync(TaskId taskId, CancellationToken ct = default) => db.Comments.DeleteManyAsync(c => c.TaskId == taskId.Value, ct);
}

/// <summary>Mongo implementation of <see cref="IHistoryRepository"/>.</summary>
public sealed class MongoHistoryRepository(MongoContext db) : IHistoryRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<HistoryEntry>> GetForTaskAsync(TaskId taskId, CancellationToken ct = default) =>
        (await db.History.Find(h => h.TaskId == taskId.Value).SortByDescending(h => h.At).ToListAsync(ct)).Select(d => d.ToDomain()).ToList();

    /// <inheritdoc />
    public Task AddManyAsync(IReadOnlyCollection<HistoryEntry> entries, CancellationToken ct = default) =>
        entries.Count == 0 ? Task.CompletedTask : db.History.InsertManyAsync(entries.Select(e => e.ToDocument()), cancellationToken: ct);

    /// <inheritdoc />
    public Task DeleteForTaskAsync(TaskId taskId, CancellationToken ct = default) => db.History.DeleteManyAsync(h => h.TaskId == taskId.Value, ct);
}

/// <summary>Mongo implementation of <see cref="IInvitationRepository"/>.</summary>
public sealed class MongoInvitationRepository(MongoContext db) : IInvitationRepository
{
    /// <inheritdoc />
    public async Task<Invitation?> GetByCodeAsync(string code, CancellationToken ct = default) =>
        (await db.Invitations.Find(i => i.Code == code).FirstOrDefaultAsync(ct))?.ToDomain();

    /// <inheritdoc />
    public Task AddAsync(Invitation invitation, CancellationToken ct = default) => db.Invitations.InsertOneAsync(invitation.ToDocument(), cancellationToken: ct);

    /// <inheritdoc />
    public Task UpdateAsync(Invitation invitation, CancellationToken ct = default) =>
        db.Invitations.ReplaceOneAsync(i => i.Id == invitation.Id, invitation.ToDocument(), cancellationToken: ct);
}
