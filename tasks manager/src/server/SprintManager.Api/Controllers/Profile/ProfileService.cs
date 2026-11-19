using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Profile;

/// <summary>Own profile: name, capacity, skills, password.</summary>
public sealed class ProfileService(IUserRepository users, IPasswordHasher hasher)
{
    /// <summary>Updates the caller's profile.</summary>
    public async Task<OperationResult<User>> UpdateAsync(UpdateProfileRequest request, CurrentUser caller, CancellationToken ct)
    {
        var user = await users.GetAsync(caller.Id, ct);
        if (user is null)
            return OperationResult.NotFound<User>("User");

        var skills = new Dictionary<string, SkillLevel>(StringComparer.OrdinalIgnoreCase);
        foreach (var (name, level) in request.Skills ?? new Dictionary<string, int>())
        {
            var trimmed = name.Trim();
            if (trimmed.Length == 0 || trimmed.Length > 50)
                return OperationResult.Invalid<User>("Skill names must be 1-50 characters.");
            if (level is < SkillLevel.Min or > SkillLevel.Max)
                return OperationResult.Invalid<User>($"Skill level must be between {SkillLevel.Min} and {SkillLevel.Max}.");
            skills[trimmed] = new SkillLevel(level);
        }

        var updated = user with { Name = request.Name.Trim(), WeeklyCapacity = new Hours(request.WeeklyCapacityHours), Skills = skills };
        await users.UpdateAsync(updated, ct);
        return OperationResult<User>.Ok(updated);
    }

    /// <summary>Changes the password after verifying the current one.</summary>
    public async Task<OperationResult<bool>> ChangePasswordAsync(ChangePasswordRequest request, CurrentUser caller, CancellationToken ct)
    {
        var user = await users.GetAsync(caller.Id, ct);
        if (user is null)
            return OperationResult.NotFound<bool>("User");
        if (!hasher.Verify(request.CurrentPassword, user.PasswordHash))
            return OperationResult.Forbidden<bool>("Current password is incorrect.");

        await users.UpdateAsync(user with { PasswordHash = hasher.Hash(request.NewPassword) }, ct);
        return OperationResult<bool>.Ok(true);
    }
}
