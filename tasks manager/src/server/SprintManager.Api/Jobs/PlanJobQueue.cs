using System.Threading.Channels;
using Microsoft.Extensions.Options;
using SprintManager.Api.Options;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Jobs;

/// <summary>In-process queue of planning jobs between the request path and the background workers.</summary>
public interface IPlanJobQueue
{
    /// <summary>Tries to enqueue without waiting; false when the queue is full (back-pressure).</summary>
    bool TryEnqueue(JobId jobId);

    /// <summary>Dequeues the next job id, waiting until one is available or cancellation.</summary>
    ValueTask<JobId> DequeueAsync(CancellationToken cancellationToken);

    /// <summary>Jobs currently waiting.</summary>
    int PendingCount { get; }
}

/// <summary>
/// <see cref="Channel{T}"/>-based queue: thread-safe, bounded, asynchronous, one producer side (HTTP requests)
/// and N consumers (workers). Only the job id travels through the channel; the job itself lives in the database,
/// so a worker always reads the latest persisted state and a restart loses nothing but the in-memory signal
/// (queued jobs can be re-enqueued from the database on startup).
/// </summary>
public sealed class ChannelPlanJobQueue : IPlanJobQueue
{
    private readonly Channel<JobId> _channel;

    /// <summary>Creates a bounded channel with the configured capacity.</summary>
    public ChannelPlanJobQueue(IOptions<PlanningOptions> options)
    {
        _channel = Channel.CreateBounded<JobId>(new BoundedChannelOptions(options.Value.QueueCapacity)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = false,
            SingleWriter = false,
        });
    }

    /// <inheritdoc />
    public bool TryEnqueue(JobId jobId) => _channel.Writer.TryWrite(jobId);

    /// <inheritdoc />
    public ValueTask<JobId> DequeueAsync(CancellationToken cancellationToken) => _channel.Reader.ReadAsync(cancellationToken);

    /// <inheritdoc />
    public int PendingCount => _channel.Reader.Count;
}
