using SmartTask.Domain.Entities;

namespace SmartTask.Application.Contracts.Authentication;

public interface IJwtTokenService
{
    Task<string> GenerateAccessTokenAsync(User user);

    string GenerateRefreshToken();
}