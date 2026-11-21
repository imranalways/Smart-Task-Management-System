using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartTask.Application.Contracts.AI;
using SmartTask.Application.Contracts.Authentication;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Application.Contracts.Services;
using SmartTask.Application.Features.Dashboard.Services;
using SmartTask.Application.Features.ProjectMembers.Services;
using SmartTask.Application.Features.Tasks.Services;
using SmartTask.Infrastructure.AI;
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

        services.AddScoped<IUserRepository, UserRepository>();

        services.AddScoped<IRoleRepository, RoleRepository>();

        services.AddScoped<IUserRoleRepository, UserRoleRepository>();

        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<
        IProjectRepository,
        ProjectRepository>();

            services.AddScoped<
                IProjectService,
                ProjectService>();
            services.AddScoped<
        IProjectMemberRepository,
        ProjectMemberRepository>();

            services.AddScoped<
                IProjectMemberService,
                ProjectMemberService>();

            services.AddScoped<
        ITaskRepository,
        TaskRepository>();

            services.AddScoped<
        ITaskService,
        TaskService>();
        services.AddScoped<
        IDashboardService,
        DashboardService>();

        services.Configure<AiSettings>(
    configuration.GetSection("AI"));

        services.AddScoped<
            IAiProvider,
            GeminiProvider>();

        services.AddScoped<
            IAIService,
            AIService>();


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