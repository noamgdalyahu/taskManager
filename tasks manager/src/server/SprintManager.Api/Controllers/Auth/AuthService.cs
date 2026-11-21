using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Auth;

/// <summary>Why authentication failed.</summary>
public enum AuthErrorCode
{
    /// <summary>Email already registered.</summary>
    EmailTaken,
    /// <summary>Email or password wrong (deliberately not distinguished).</summary>
    InvalidCredentials,
    /// <summary>Email failed domain validation.</summary>
    InvalidEmail,
}

/// <summary>Outcome of register or login.</summary>
public sealed record AuthResult
{
    /// <summary>Success flag.</summary>
    public bool IsSuccess { get; private init; }

    /// <summary>Response on success.</summary>
    public AuthResponse? Response { get; private init; }

    /// <summary>Error on failure.</summary>
    public AuthErrorCode? Error { get; private init; }

    /// <summary>Success.</summary>
    public static AuthResult Success(AuthResponse response) => new() { IsSuccess = true, Response = response };

    /// <summary>Failure.</summary>
    public static AuthResult Failed(AuthErrorCode error) => new() { IsSuccess = false, Error = error };
}

/// <summary>Registration and login.</summary>
public sealed class AuthService(IUserRepository users, IPasswordHasher hasher, JwtTokenService tokens, IClock clock)
{
    /// <summary>Creates a user and signs them in.</summary>
    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        if (!EmailAddress.TryParse(request.Email, out var email))
            return AuthResult.Failed(AuthErrorCode.InvalidEmail);

        if (await users.GetByEmailAsync(email, cancellationToken) is not null)
            return AuthResult.Failed(AuthErrorCode.EmailTaken);

        var user = new User(
            MemberId.New(),
            email,
            hasher.Hash(request.Password),
            request.Name.Trim(),
            request.Role,
            new Dictionary<string, SkillLevel>(StringComparer.OrdinalIgnoreCase),
            new Hours(40),
            clock.UtcNow);

        await users.AddAsync(user, cancellationToken);
        return AuthResult.Success(Issue(user));
    }

    /// <summary>Verifies credentials and signs in.</summary>
    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        if (!EmailAddress.TryParse(request.Email, out var email))
            return AuthResult.Failed(AuthErrorCode.InvalidCredentials);

        var user = await users.GetByEmailAsync(email, cancellationToken);
        var ok = user is not null && hasher.Verify(request.Password, user.PasswordHash);
        return ok ? AuthResult.Success(Issue(user!)) : AuthResult.Failed(AuthErrorCode.InvalidCredentials);
    }

    /// <summary>
    /// Issues a fresh token for someone who is already signed in, so a session that is in use does not end at the token's
    /// expiry. The user is read again, so a person who has been removed gets no new token.
    /// </summary>
    public async Task<AuthResult> RefreshAsync(CurrentUser caller, CancellationToken cancellationToken)
    {
        var user = await users.GetAsync(caller.Id, cancellationToken);
        return user is null ? AuthResult.Failed(AuthErrorCode.InvalidCredentials) : AuthResult.Success(Issue(user));
    }

    /// <summary>Loads the caller's profile.</summary>
    public Task<User?> GetAsync(CurrentUser caller, CancellationToken cancellationToken) =>
        users.GetAsync(caller.Id, cancellationToken);

    private AuthResponse Issue(User user)
    {
        var (token, expires) = tokens.Issue(user);
        return new AuthResponse(token, expires, user.ToDto());
    }
}
