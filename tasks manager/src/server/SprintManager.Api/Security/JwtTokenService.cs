using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SprintManager.Api.Options;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Security;

/// <summary>Issues signed JWT access tokens carrying the user id, email, name and role.</summary>
public sealed class JwtTokenService(IOptions<JwtOptions> options, IClock clock)
{
    private readonly JwtOptions _options = options.Value;

    /// <summary>Creates an access token and returns it with its expiry.</summary>
    public (string Token, DateTimeOffset ExpiresAt) Issue(User user)
    {
        var expires = clock.UtcNow.AddMinutes(_options.AccessTokenMinutes);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.Value.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email.Value),
            new Claim(JwtRegisteredClaimNames.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: clock.UtcNow.UtcDateTime,
            expires: expires.UtcDateTime,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
