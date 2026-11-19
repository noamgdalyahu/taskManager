using SprintManager.Core.Abstractions;

namespace SprintManager.Api.Infrastructure;

/// <summary>Real clock. Local date uses the server's time zone (Israel for this deployment).</summary>
public sealed class SystemClock : IClock
{
    /// <inheritdoc />
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;

    /// <inheritdoc />
    public DateOnly Today => DateOnly.FromDateTime(DateTime.Now);
}
