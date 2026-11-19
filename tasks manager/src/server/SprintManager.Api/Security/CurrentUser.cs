using System.Security.Claims;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Security;

/// <summary>The authenticated caller, extracted once from the JWT claims.</summary>
/// <param name="Id">User id.</param>
/// <param name="Role">Role.</param>
public readonly record struct CurrentUser(MemberId Id, UserRole Role)
{
    /// <summary>True for managers.</summary>
    public bool IsManager => Role is UserRole.Manager;

    /// <summary>Reads the caller from the principal; throws when the token lacks the claims (misconfiguration).</summary>
    public static CurrentUser From(ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
        var role = principal.FindFirstValue(ClaimTypes.Role);
        if (!Guid.TryParse(sub, out var id) || !Enum.TryParse<UserRole>(role, out var parsedRole))
            throw new InvalidOperationException("Authenticated principal is missing the subject or role claim.");

        return new CurrentUser(new MemberId(id), parsedRole);
    }
}

/// <summary>Authorization policy names used on controllers.</summary>
public static class Policies
{
    /// <summary>Caller must be a manager.</summary>
    public const string Manager = "Manager";
}
