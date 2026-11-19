namespace SprintManager.Core.Abstractions;

/// <summary>Source of "now", injectable so time-dependent logic is testable.</summary>
public interface IClock
{
    /// <summary>Current instant.</summary>
    DateTimeOffset UtcNow { get; }

    /// <summary>Today's date in the configured local zone.</summary>
    DateOnly Today { get; }
}

/// <summary>Password hashing. The interface lives in Core so services can be tested without the real hasher.</summary>
public interface IPasswordHasher
{
    /// <summary>Produces a self-describing hash (algorithm, iterations, salt, digest).</summary>
    string Hash(string password);

    /// <summary>Verifies a password against a stored hash in constant time.</summary>
    bool Verify(string password, string storedHash);
}
