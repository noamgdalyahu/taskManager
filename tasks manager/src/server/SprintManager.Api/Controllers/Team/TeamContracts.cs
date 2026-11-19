using System.ComponentModel.DataAnnotations;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Team;

/// <summary>A team member with the fields assignment uses.</summary>
public sealed record TeamMemberDto(Guid Id, string Name, string Email, UserRole Role, IReadOnlyDictionary<string, int> Skills, double WeeklyCapacityHours);

/// <summary>Create an invitation.</summary>
public sealed record InviteRequest([EmailAddress] string? Email, [Range(1, 30)] int ExpiresInDays = 7);

/// <summary>An invitation code to share.</summary>
public sealed record InvitationDto(string Code, string? Email, DateTimeOffset ExpiresAt);

/// <summary>Redeem an invitation.</summary>
public sealed record JoinRequest([Required, MinLength(4), MaxLength(32)] string Code);
