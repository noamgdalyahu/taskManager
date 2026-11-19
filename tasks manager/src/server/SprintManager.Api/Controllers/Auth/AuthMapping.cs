using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Auth;

/// <summary>Explicit mapping between domain users and API contracts.</summary>
public static class AuthMapping
{
    /// <summary>Domain to client DTO.</summary>
    public static UserDto ToDto(this User user) => new(
        user.Id.Value,
        user.Email.Value,
        user.Name,
        user.Role,
        user.Skills.ToDictionary(kv => kv.Key, kv => kv.Value.Value, StringComparer.OrdinalIgnoreCase),
        user.WeeklyCapacity.Value);
}