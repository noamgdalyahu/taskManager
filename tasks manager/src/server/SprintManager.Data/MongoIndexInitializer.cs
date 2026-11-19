using Microsoft.Extensions.Hosting;
using MongoDB.Driver;
using SprintManager.Data.Documents;

namespace SprintManager.Data;

/// <summary>
/// Creates the indexes on startup. Idempotent: Mongo ignores an index that already exists with the same spec.
/// Indexes are defined in code so the schema chapter of the book can point at one file.
/// </summary>
public sealed class MongoIndexInitializer(MongoContext db) : IHostedService
{
    /// <inheritdoc />
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await db.Users.Indexes.CreateOneAsync(
            new CreateIndexModel<UserDocument>(Builders<UserDocument>.IndexKeys.Ascending(u => u.Email), new CreateIndexOptions { Unique = true }),
            cancellationToken: cancellationToken);

        await db.Projects.Indexes.CreateOneAsync(
            new CreateIndexModel<ProjectDocument>(Builders<ProjectDocument>.IndexKeys.Ascending(p => p.MemberIds)),
            cancellationToken: cancellationToken);

        await db.Sprints.Indexes.CreateOneAsync(
            new CreateIndexModel<SprintDocument>(Builders<SprintDocument>.IndexKeys.Ascending(s => s.ProjectId)),
            cancellationToken: cancellationToken);

        await db.Tasks.Indexes.CreateManyAsync(
        [
            new CreateIndexModel<TaskDocument>(Builders<TaskDocument>.IndexKeys.Ascending(t => t.ProjectId)),
            new CreateIndexModel<TaskDocument>(Builders<TaskDocument>.IndexKeys.Ascending(t => t.SprintId)),
            new CreateIndexModel<TaskDocument>(Builders<TaskDocument>.IndexKeys.Ascending(t => t.AssigneeId)),
        ], cancellationToken);

        await db.TimeLogs.Indexes.CreateOneAsync(
            new CreateIndexModel<TimeLogDocument>(Builders<TimeLogDocument>.IndexKeys.Ascending(l => l.TaskId)), cancellationToken: cancellationToken);
        await db.Comments.Indexes.CreateOneAsync(
            new CreateIndexModel<CommentDocument>(Builders<CommentDocument>.IndexKeys.Ascending(c => c.TaskId)), cancellationToken: cancellationToken);
        await db.History.Indexes.CreateOneAsync(
            new CreateIndexModel<HistoryDocument>(Builders<HistoryDocument>.IndexKeys.Ascending(h => h.TaskId).Descending(h => h.At)), cancellationToken: cancellationToken);
        await db.Invitations.Indexes.CreateOneAsync(
            new CreateIndexModel<InvitationDocument>(Builders<InvitationDocument>.IndexKeys.Ascending(i => i.Code), new CreateIndexOptions { Unique = true }), cancellationToken: cancellationToken);

        await db.PlanJobs.Indexes.CreateManyAsync(
        [
            new CreateIndexModel<PlanJobDocument>(Builders<PlanJobDocument>.IndexKeys.Ascending(j => j.SprintId).Descending(j => j.CreatedAt)),
            new CreateIndexModel<PlanJobDocument>(Builders<PlanJobDocument>.IndexKeys.Ascending(j => j.Status)),
        ], cancellationToken);
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
