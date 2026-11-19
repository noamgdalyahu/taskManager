using System.Security.Cryptography;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Team;

/// <summary>Team management: members, invitations, joining, removal.</summary>
public sealed class TeamService(
    IProjectRepository projects,
    IUserRepository users,
    IInvitationRepository invitations,
    ProjectAccess access,
    IClock clock)
{
    /// <summary>Team members with skills and capacity.</summary>
    public async Task<OperationResult<IReadOnlyList<User>>> TeamAsync(ProjectId id, CurrentUser caller, CancellationToken ct)
    {
        var found = await access.AsMemberAsync(id, caller, ct);
        if (!found.IsSuccess)
            return OperationResult<IReadOnlyList<User>>.Fail(found.Error!.Value);

        return OperationResult<IReadOnlyList<User>>.Ok(await users.GetManyAsync(found.Value!.MemberIds, ct));
    }

    /// <summary>Creates an invitation code.</summary>
    public async Task<OperationResult<Invitation>> InviteAsync(ProjectId id, InviteRequest request, CurrentUser caller, CancellationToken ct)
    {
        var found = await access.AsManagerAsync(id, caller, ct);
        if (!found.IsSuccess)
            return OperationResult<Invitation>.Fail(found.Error!.Value);

        EmailAddress? email = null;
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            if (!EmailAddress.TryParse(request.Email, out var parsed))
                return OperationResult.Invalid<Invitation>("Invalid email.");
            email = parsed;
        }

        var invitation = new Invitation(Guid.NewGuid(), id, NewCode(), email, clock.UtcNow.AddDays(request.ExpiresInDays), null);
        await invitations.AddAsync(invitation, ct);
        return OperationResult<Invitation>.Ok(invitation);
    }

    /// <summary>Redeems a code and joins the project.</summary>
    public async Task<OperationResult<Project>> JoinAsync(JoinRequest request, CurrentUser caller, CancellationToken ct)
    {
        var invitation = await invitations.GetByCodeAsync(request.Code.Trim().ToUpperInvariant(), ct);
        if (invitation is null || invitation.UsedBy is not null || invitation.ExpiresAt < clock.UtcNow)
            return OperationResult.NotFound<Project>("Invitation");

        var me = await users.GetAsync(caller.Id, ct);
        if (me is null)
            return OperationResult.NotFound<Project>("User");
        if (invitation.Email is { } restricted && restricted != me.Email)
            return OperationResult.Forbidden<Project>("This invitation is for a different email.");

        var project = await projects.GetAsync(invitation.ProjectId, ct);
        if (project is null)
            return OperationResult.NotFound<Project>("Project");

        if (!project.HasMember(caller.Id))
        {
            project = project with { MemberIds = [.. project.MemberIds, caller.Id] };
            await projects.UpdateAsync(project, ct);
        }
        await invitations.UpdateAsync(invitation with { UsedBy = caller.Id }, ct);
        return OperationResult<Project>.Ok(project);
    }

    /// <summary>Removes a member (not the owner).</summary>
    public async Task<OperationResult<Project>> RemoveMemberAsync(ProjectId id, MemberId memberId, CurrentUser caller, CancellationToken ct)
    {
        var found = await access.AsManagerAsync(id, caller, ct);
        if (!found.IsSuccess)
            return found;

        var project = found.Value!;
        if (memberId == project.OwnerId)
            return OperationResult.Conflict<Project>("The owner cannot be removed.");
        if (!project.HasMember(memberId))
            return OperationResult.NotFound<Project>("Member");

        var updated = project with { MemberIds = project.MemberIds.Where(m => m != memberId).ToList() };
        await projects.UpdateAsync(updated, ct);
        return OperationResult<Project>.Ok(updated);
    }

    /// <summary>8 characters from an unambiguous alphabet (no 0/O/1/I), ~40 bits of entropy.</summary>
    private static string NewCode()
    {
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return string.Create(8, alphabet, (span, a) =>
        {
            for (var i = 0; i < span.Length; i++)
                span[i] = a[RandomNumberGenerator.GetInt32(a.Length)];
        });
    }
}
