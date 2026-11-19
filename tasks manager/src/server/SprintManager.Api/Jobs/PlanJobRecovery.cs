using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Jobs;

/// <summary>What recovery did, for logging and tests.</summary>
/// <param name="Requeued">Queued jobs put back on the in-memory queue.</param>
/// <param name="Interrupted">Running jobs that died with the previous process and were marked failed.</param>
/// <param name="Dropped">Queued jobs that no longer fit in the queue and were marked failed.</param>
public readonly record struct RecoveryReport(int Requeued, int Interrupted, int Dropped);

/// <summary>
/// The queue lives in memory but jobs live in the database, so a restart can leave rows that nobody will ever process.
/// On startup: <c>Queued</c> jobs are put back on the queue (oldest first, so order is kept); <c>Running</c> jobs belonged
/// to the previous process and can never finish, so they are marked <c>Failed</c> and the manager can simply run again.
/// </summary>
public sealed class PlanJobRecovery(IPlanJobRepository jobs, IPlanJobQueue queue, IClock clock)
{
    /// <summary>Repairs job state after a restart.</summary>
    public async Task<RecoveryReport> RecoverAsync(CancellationToken ct)
    {
        int requeued = 0, interrupted = 0, dropped = 0;

        foreach (var job in await jobs.GetByStatusAsync(PlanJobStatus.Running, ct))
        {
            await jobs.UpdateAsync(job.Faulted("Interrupted by a server restart. Run the plan again.", clock.UtcNow), ct);
            interrupted++;
        }

        foreach (var job in await jobs.GetByStatusAsync(PlanJobStatus.Queued, ct))
        {
            if (queue.TryEnqueue(job.Id))
            {
                requeued++;
                continue;
            }
            await jobs.UpdateAsync(job.Faulted("Queue was full after a server restart. Run the plan again.", clock.UtcNow), ct);
            dropped++;
        }

        return new RecoveryReport(requeued, interrupted, dropped);
    }
}

/// <summary>Runs <see cref="PlanJobRecovery"/> once at startup, before the workers begin consuming.</summary>
public sealed class PlanJobRecoveryService(PlanJobRecovery recovery, ILogger<PlanJobRecoveryService> logger) : IHostedService
{
    /// <inheritdoc />
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var report = await recovery.RecoverAsync(cancellationToken);
        if (report.Requeued + report.Interrupted + report.Dropped > 0)
            logger.LogWarning("Plan job recovery: {Requeued} re-queued, {Interrupted} interrupted, {Dropped} dropped", report.Requeued, report.Interrupted, report.Dropped);
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
