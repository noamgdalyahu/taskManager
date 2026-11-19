using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Controllers.Projects;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Team;

/// <summary>Team management page.</summary>
[Route("api/projects")]
public sealed class TeamController(TeamService service) : ApiControllerBase
{
    /// <summary>Team with skills and capacity.</summary>
    [HttpGet("{id:guid}/team")]
    [ProducesResponseType<IReadOnlyList<TeamMemberDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Team(Guid id, CancellationToken ct) =>
        From(await service.TeamAsync(new ProjectId(id), Caller, ct), team => team.Select(u => u.ToTeamMemberDto()).ToList());

    /// <summary>Creates an invitation code (managers).</summary>
    [HttpPost("{id:guid}/invitations")]
    [ProducesResponseType<InvitationDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Invite(Guid id, InviteRequest request, CancellationToken ct) =>
        From(await service.InviteAsync(new ProjectId(id), request, Caller, ct), i => i.ToDto());

    /// <summary>Joins a project by invitation code.</summary>
    [HttpPost("join")]
    [ProducesResponseType<ProjectDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Join(JoinRequest request, CancellationToken ct) =>
        From(await service.JoinAsync(request, Caller, ct), p => p.ToDto());

    /// <summary>Removes a member (managers).</summary>
    [HttpDelete("{id:guid}/members/{memberId:guid}")]
    [ProducesResponseType<ProjectDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveMember(Guid id, Guid memberId, CancellationToken ct) =>
        From(await service.RemoveMemberAsync(new ProjectId(id), new MemberId(memberId), Caller, ct), p => p.ToDto());
}
