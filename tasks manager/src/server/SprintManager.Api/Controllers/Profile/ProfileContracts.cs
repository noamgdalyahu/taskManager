using System.ComponentModel.DataAnnotations;

namespace SprintManager.Api.Controllers.Profile;

/// <summary>Edit own profile; skills drive the assignment.</summary>
public sealed record UpdateProfileRequest(
    [Required, MinLength(1), MaxLength(100)] string Name,
    [Range(0, 80)] double WeeklyCapacityHours,
    IReadOnlyDictionary<string, int>? Skills);

/// <summary>Change password.</summary>
public sealed record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(8), MaxLength(128)] string NewPassword);
