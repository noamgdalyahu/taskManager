using System.ComponentModel.DataAnnotations;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Auth;

/// <summary>Registration payload.</summary>
public sealed record RegisterRequest(
    [Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MinLength(8), MaxLength(128)] string Password,
    [Required, MinLength(1), MaxLength(100)] string Name,
    [Required] UserRole Role);

/// <summary>Login payload.</summary>
public sealed record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

/// <summary>A user as exposed to clients (never the hash).</summary>
public sealed record UserDto(
    Guid Id,
    string Email,
    string Name,
    UserRole Role,
    IReadOnlyDictionary<string, int> Skills,
    double WeeklyCapacityHours);

/// <summary>Successful authentication.</summary>
public sealed record AuthResponse(string AccessToken, DateTimeOffset ExpiresAt, UserDto User);
