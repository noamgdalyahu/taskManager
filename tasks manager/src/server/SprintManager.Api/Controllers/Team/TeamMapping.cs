using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Team;

/// <summary>Explicit mappings for team management.</summary>
public static class TeamMapping
{
    /// <summary>User to team member DTO.</summary>
    public static TeamMemberDto ToTeamMemberDto(this User u) =>
        new(u.Id.Value, u.Name, u.Email.Value, u.Role, u.Skills.ToDictionary(kv => kv.Key, kv => kv.Value.Value, StringComparer.OrdinalIgnoreCase), u.WeeklyCapacity.Value);

    /// <summary>Invitation to DTO.</summary>
    public static InvitationDto ToDto(this Invitation i) => new(i.Code, i.Email?.Value, i.ExpiresAt);
}
