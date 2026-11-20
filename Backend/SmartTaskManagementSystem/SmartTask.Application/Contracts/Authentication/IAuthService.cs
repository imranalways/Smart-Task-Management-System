using SmartTask.Application.Features.Auth.DTOs;

namespace SmartTask.Application.Contracts.Authentication;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(
        RegisterRequestDto request);

    Task<AuthResponseDto> LoginAsync(
        LoginRequestDto request);

    Task<AuthResponseDto> RefreshTokenAsync(
        string refreshToken);

    Task LogoutAsync(
        string refreshToken);
}
