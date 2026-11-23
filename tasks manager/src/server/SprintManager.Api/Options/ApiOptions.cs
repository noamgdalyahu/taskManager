namespace SprintManager.Api.Options;

/// <summary>JWT settings, bound from the "Jwt" section.</summary>
public sealed class JwtOptions
{
    /// <summary>Section name.</summary>
    public const string Section = "Jwt";

    /// <summary>Token issuer.</summary>
    public required string Issuer { get; init; }

    /// <summary>Token audience.</summary>
    public required string Audience { get; init; }

    /// <summary>HMAC signing key; at least 32 bytes. Comes from user-secrets or environment, never from source.</summary>
    public required string SigningKey { get; init; }

    /// <summary>Access token lifetime. The client renews it while the app is open, so this is how long a signed-in but idle session lasts.</summary>
    public int AccessTokenMinutes { get; init; } = 120;
}

/// <summary>Background planning settings, bound from the "Planning" section.</summary>
public sealed class PlanningOptions
{
    /// <summary>Section name.</summary>
    public const string Section = "Planning";

    /// <summary>Parallel workers consuming the job queue.</summary>
    public int WorkerCount { get; init; } = 2;

    /// <summary>Per-job timeout.</summary>
    public int JobTimeoutSeconds { get; init; } = 60;

    /// <summary>Bounded queue capacity; enqueue fails fast beyond it (back-pressure instead of memory growth).</summary>
    public int QueueCapacity { get; init; } = 100;
}

/// <summary>CORS settings, bound from the "Cors" section.</summary>
public sealed class CorsOptions
{
    /// <summary>Section name.</summary>
    public const string Section = "Cors";

    /// <summary>Allowed browser origins (the React dev server and the deployed client).</summary>
    public string[] Origins { get; init; } = [];
}
