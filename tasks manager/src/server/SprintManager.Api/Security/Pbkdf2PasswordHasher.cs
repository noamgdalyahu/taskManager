using System.Security.Cryptography;
using SprintManager.Core.Abstractions;

namespace SprintManager.Api.Security;

/// <summary>
/// PBKDF2-SHA256 password hashing with a random per-user salt.
/// Stored format: <c>pbkdf2-sha256$iterations$base64(salt)$base64(hash)</c>, so the algorithm and
/// iteration count travel with the hash and can be raised later without breaking old users.
/// </summary>
/// <remarks>
/// Why PBKDF2: built into .NET (no extra dependency), NIST-approved, and slow by design (iterations)
/// so brute forcing a leaked database is expensive. The salt defeats rainbow tables. Verification uses
/// <see cref="CryptographicOperations.FixedTimeEquals"/> to avoid timing side channels.
/// </remarks>
public sealed class Pbkdf2PasswordHasher : IPasswordHasher
{
    private const string Algorithm = "pbkdf2-sha256";
    private const int Iterations = 210_000;   // OWASP 2023 recommendation for PBKDF2-HMAC-SHA256
    private const int SaltBytes = 16;
    private const int HashBytes = 32;

    /// <inheritdoc />
    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrEmpty(password);

        var salt = RandomNumberGenerator.GetBytes(SaltBytes);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, HashBytes);
        return $"{Algorithm}${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    /// <inheritdoc />
    public bool Verify(string password, string storedHash)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(storedHash))
            return false;

        var parts = storedHash.Split('$');
        if (parts is not [Algorithm, var iterText, var saltText, var hashText] || !int.TryParse(iterText, out var iterations))
            return false;

        var salt = Convert.FromBase64String(saltText);
        var expected = Convert.FromBase64String(hashText);
        var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
