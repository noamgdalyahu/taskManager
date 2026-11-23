using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SprintManager.Api.Security;

namespace SprintManager.Api.Controllers.Auth;

/// <summary>Login / register page, and the current user.</summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService auth) : ControllerBase
{
    /// <summary>Registers a new user and returns an access token.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await auth.RegisterAsync(request, cancellationToken);
        return result.IsSuccess ? StatusCode(StatusCodes.Status201Created, result.Response) : ToProblem(result);
    }

    /// <summary>Signs in and returns an access token.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await auth.LoginAsync(request, cancellationToken);
        return result.IsSuccess ? Ok(result.Response) : ToProblem(result);
    }

    /// <summary>Returns a new access token for a signed-in user whose current token is still valid (a sliding session).</summary>
    [HttpPost("refresh")]
    [Authorize]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        var result = await auth.RefreshAsync(CurrentUser.From(User), cancellationToken);
        return result.IsSuccess ? Ok(result.Response) : ToProblem(result);
    }

    /// <summary>Returns the caller's profile.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType<UserDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var user = await auth.GetAsync(CurrentUser.From(User), cancellationToken);
        return user is null ? NotFound() : Ok(user.ToDto());
    }

    private IActionResult ToProblem(AuthResult result) => result.Error switch
    {
        AuthErrorCode.EmailTaken => Problem(title: "Email already registered.", statusCode: StatusCodes.Status409Conflict),
        AuthErrorCode.InvalidEmail => Problem(title: "Invalid email address.", statusCode: StatusCodes.Status400BadRequest),
        AuthErrorCode.InvalidCredentials => Problem(title: "Invalid email or password.", statusCode: StatusCodes.Status401Unauthorized),
        _ => Problem(statusCode: StatusCodes.Status500InternalServerError),
    };
}
