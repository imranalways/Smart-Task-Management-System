using Microsoft.AspNetCore.Identity;
using SmartTask.Application.Contracts.Authentication;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Application.Exceptions;
using SmartTask.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartTask.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly PasswordHasher<User> _passwordHasher;
        public AuthService(
    IUserRepository userRepository,
    IRoleRepository roleRepository,
    IUserRoleRepository userRoleRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IJwtTokenService jwtTokenService)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _userRoleRepository = userRoleRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _jwtTokenService = jwtTokenService;

            _passwordHasher = new PasswordHasher<User>();
        }
        public async Task<AuthResponseDto> RegisterAsync(
    RegisterRequestDto request)
        {
            var exists =
                await _userRepository.ExistsAsync(
                    request.Email);

            if (exists)
                throw new BadRequestException(
                    "Email already exists.");

            var teamRole =
                await _roleRepository.GetByNameAsync(
                    "TeamMember");

            if (teamRole is null)
                throw new Exception(
                    "Default role not found.");

            var user = new User
            {
                Id = Guid.NewGuid(),

                FirstName = request.FirstName,

                LastName = request.LastName,

                Email = request.Email,

                IsActive = true,

                CreatedAt = DateTime.UtcNow,

                UpdatedAt = DateTime.UtcNow
            };

            user.PasswordHash =
                _passwordHasher.HashPassword(
                    user,
                    request.Password);

            await _userRepository.AddAsync(user);

            await _userRepository.SaveChangesAsync();

            var userRole = new UserRole
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                RoleId = teamRole.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRoleRepository.AddAsync(userRole);

            await _userRoleRepository.SaveChangesAsync();


            var accessToken =
                await _jwtTokenService
                    .GenerateAccessTokenAsync(user);

            var refreshToken =
                _jwtTokenService
                    .GenerateRefreshToken();

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                Email = user.Email,
                FullName =
                    $"{user.FirstName} {user.LastName}",
                Role = teamRole.Name
            };
        }
        public async Task<AuthResponseDto> LoginAsync(
    LoginRequestDto request)
        {
            var user =
                await _userRepository
                    .GetByEmailAsync(request.Email);

            if (user is null)
                throw new UnauthorizedException(
                    "Invalid credentials.");

            var result =
                _passwordHasher.VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.Password);

            if (result ==
                PasswordVerificationResult.Failed)
            {
                throw new UnauthorizedException(
                    "Invalid credentials.");
            }

            var accessToken =
                await _jwtTokenService
                .GenerateAccessTokenAsync(user);

            var refreshToken =
                _jwtTokenService.GenerateRefreshToken();

            await SaveRefreshTokenAsync(
                user.Id,
                refreshToken);

            return new AuthResponseDto
            {
                AccessToken = accessToken,

                RefreshToken = refreshToken,

                Email = user.Email,

                FullName =
                    $"{user.FirstName} {user.LastName}",

                Role = user.UserRoles
                    .FirstOrDefault()?.Role?.Name ?? string.Empty
            };
        }
        private async Task SaveRefreshTokenAsync(
    Guid userId,
    string token)
        {
            var refreshToken =
                new RefreshToken
                {
                    Id = Guid.NewGuid(),

                    Token = token,

                    UserId = userId,

                    ExpiresAt =
                        DateTime.UtcNow.AddDays(7),

                    CreatedAt =
                        DateTime.UtcNow
                };

            await _refreshTokenRepository
                .AddAsync(refreshToken);

            await _refreshTokenRepository
                .SaveChangesAsync();
        }
        public async Task<AuthResponseDto>
RefreshTokenAsync(string token)
        {
            var refreshToken =
                await _refreshTokenRepository
                    .GetByTokenAsync(token);

            if (refreshToken is null ||
                !refreshToken.IsActive)
            {
                throw new UnauthorizedException(
                    "Invalid refresh token.");
            }

            refreshToken.RevokedAt =
                DateTime.UtcNow;

            var newRefreshToken =
                _jwtTokenService.GenerateRefreshToken();

            refreshToken.ReplacedByToken =
                newRefreshToken;

            await _refreshTokenRepository
                .UpdateAsync(refreshToken);

            await SaveRefreshTokenAsync(
                refreshToken.UserId,
                newRefreshToken);

            var accessToken =
                await _jwtTokenService
                    .GenerateAccessTokenAsync(
                        refreshToken.User);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = newRefreshToken,
                Email = refreshToken.User.Email,
                FullName =
                    $"{refreshToken.User.FirstName} {refreshToken.User.LastName}",
                Role = refreshToken.User.UserRoles
                    .FirstOrDefault()?.Role?.Name ?? string.Empty
            };
        }
        public async Task LogoutAsync(
    string token)
        {
            var refreshToken =
                await _refreshTokenRepository
                    .GetByTokenAsync(token);

            if (refreshToken is null)
                return;

            refreshToken.RevokedAt =
                DateTime.UtcNow;

            await _refreshTokenRepository
                .UpdateAsync(refreshToken);

            await _refreshTokenRepository
                .SaveChangesAsync();
        }
    }
}
