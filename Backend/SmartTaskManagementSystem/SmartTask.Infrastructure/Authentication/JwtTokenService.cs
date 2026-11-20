using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SmartTask.Application.Contracts.Authentication;
using SmartTask.Domain.Entities;
using SmartTask.Infrastructure.Authentication;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
public class JwtTokenService : IJwtTokenService
{
    private readonly JwtSettings _jwt;

    public JwtTokenService(
        IOptions<JwtSettings> options)
    {
        _jwt = options.Value;
    }

    public Task<string> GenerateAccessTokenAsync(
        User user)
    {
        var claims = new List<Claim>
                {
                    new Claim(
                        ClaimTypes.NameIdentifier,
                        user.Id.ToString()),

                    new Claim(
                        ClaimTypes.Email,
                        user.Email),

                    new Claim(
                        ClaimTypes.Role,
                        user.Role.Name)
                };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _jwt.Secret));

        var credentials =
            new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

        var token =
            new JwtSecurityToken(
                _jwt.Issuer,
                _jwt.Audience,
                claims,
                expires: DateTime.UtcNow
                    .AddMinutes(_jwt.ExpiryMinutes),
                signingCredentials: credentials);

        return Task.FromResult(
            new JwtSecurityTokenHandler()
                .WriteToken(token));
    }

    public string GenerateRefreshToken()
    {
        var randomBytes =
            RandomNumberGenerator.GetBytes(64);

        return Convert.ToBase64String(
            randomBytes);
    }
}