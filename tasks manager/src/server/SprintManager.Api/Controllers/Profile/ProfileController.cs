using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Controllers.Auth;
using SprintManager.Api.Controllers.Shared;

namespace SprintManager.Api.Controllers.Profile;

/// <summary>Profile page: name, weekly capacity, skills, password.</summary>
[Route("api/me")]
public sealed class ProfileController(ProfileService profile) : ApiControllerBase
{
    /// <summary>Updates name, weekly capacity and skills.</summary>
    [HttpPut("profile")]
    [ProducesResponseType<UserDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(UpdateProfileRequest request, CancellationToken ct) =>
        From(await profile.UpdateAsync(request, Caller, ct), u => u.ToDto());

    /// <summary>Changes the password.</summary>
    [HttpPut("password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct) =>
        NoContentFrom(await profile.ChangePasswordAsync(request, Caller, ct));
}
