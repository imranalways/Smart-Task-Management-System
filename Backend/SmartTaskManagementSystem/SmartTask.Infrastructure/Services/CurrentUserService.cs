using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace SmartTask.Infrastructure.Services
{
    public class CurrentUserService
        : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(
            IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid UserId =>
            Guid.Parse(
                _httpContextAccessor
                    .HttpContext?
                    .User?
                    .FindFirstValue(
                        ClaimTypes.NameIdentifier)
                    ?? Guid.Empty.ToString());

        public string Email =>
            _httpContextAccessor
            .HttpContext?
            .User?
            .FindFirstValue(
                ClaimTypes.Email)
            ?? "";

        public string Role =>
            _httpContextAccessor
            .HttpContext?
            .User?
            .FindFirstValue(
                ClaimTypes.Role)
            ?? "";

        public bool IsAuthenticated =>
            _httpContextAccessor
                .HttpContext?
                .User?
                .Identity?
                .IsAuthenticated
            ?? false;
    }
}
