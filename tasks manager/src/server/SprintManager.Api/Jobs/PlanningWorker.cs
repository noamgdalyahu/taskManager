using Microsoft.Extensions.Options;
using SprintManager.Api.Options;
using SprintManager.Api.Controllers.SprintPlanning.Plans;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Jobs;

/// <summary>
/// Hosted service that runs planning jobs in the background with <see cref="PlanningOptions.WorkerCount"/>
/// parallel consumers. This is the project's mandatory asynchronous/parallel element: the HTTP request only
/// enqueues and returns 202; the optimisation runs here, off the request path.
/// </summary>
public sealed class PlanningWorker(
    IPlanJobQueue queue,
    IServiceScopeFactory scopes,
    IOptions<PlanningOptions> options,
    ILogger<PlanningWorker> logger) : BackgroundService
{
    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var workers = Enumerable.Range(1, options.Value.WorkerCount)
            .Select(n => ConsumeAsync(n, stoppingToken))
            .ToArray();
        logger.LogInformation("Planning worker started with {Count} consumers", workers.Length);
        return Task.WhenAll(workers);
    }

    private async Task ConsumeAsync(int workerNumber, CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            JobId jobId;
            try
            {
                jobId = await queue.DequeueAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            await RunOneAsync(workerNumber, jobId, stoppingToken);
        }
    }

    private async Task RunOneAsync(int workerNumber, JobId jobId, CancellationToken stoppingToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(options.Value.JobTimeoutSeconds));

        await using var scope = scopes.CreateAsyncScope();
        var planning = scope.ServiceProvider.GetRequiredService<PlanningService>();

        try
        {
            logger.LogInformation("Worker {Worker} running job {Job}", workerNumber, jobId);
            await planning.RunAsync(jobId, timeout.Token);
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !stoppingToken.IsCancellationRequested)
        {
            // RunAsync records failures on the job; this catch is the last line of defence so one bad job
            // never kills the consumer loop.
            logger.LogError(ex, "Job {Job} crashed outside RunAsync", jobId);
        }
    }
}
