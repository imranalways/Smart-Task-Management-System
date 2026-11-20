using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartTask.Application.Contracts.Authentication;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Infrastructure.Authentication;
using SmartTask.Infrastructure.Persistence;
using SmartTask.Infrastructure.Repositories;
using SmartTask.Infrastructure.Services;
public static class DependencyInjection
{
    public static IServiceCollection
        AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(
            options =>
            {
                options.UseSqlServer(
                    configuration
                    .GetConnectionString(
                        "DefaultConnection"));
            });

        services.Configure<JwtSettings>(
            configuration.GetSection(
                "JwtSettings"));

        services.AddScoped<
            IUserRepository,
            UserRepository>();

        services.AddScoped<
            IRoleRepository,
            RoleRepository>();

        services.AddScoped<
            IRefreshTokenRepository,
            RefreshTokenRepository>();

        services.AddScoped<
            IJwtTokenService,
            JwtTokenService>();
        services.AddScoped<
        IAuthService,
        AuthService>();
        services.AddHttpContextAccessor();

        services.AddScoped<
            ICurrentUserService,
            CurrentUserService>();
        return services;
    }
}