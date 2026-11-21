using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SmartTask.Domain.Constants;
using SmartTask.Domain.Entities;
using SmartTask.Infrastructure.Persistence;

namespace SmartTask.Infrastructure.Persistence.Seeders;

public static class AdminSeeder
{
    public static async Task SeedAsync(
        IServiceProvider serviceProvider)
    {

        using var scope =
            serviceProvider.CreateScope();
        var adminSettings =
            scope.ServiceProvider
            .GetRequiredService<
            IOptions<DefaultAdminSettings>>()
            .Value;

        var context =
            scope.ServiceProvider
                .GetRequiredService<ApplicationDbContext>();

        var adminRole =
            await context.Roles
                .FirstOrDefaultAsync(
                    x => x.Name == Roles.Admin);

        if (adminRole is null)
        {
            return;
        }

        var adminExists =
            await context.Users
                .AnyAsync(x =>
                    x.Email ==
                    adminSettings.Email);

        if (adminExists)
        {
            return;
        }

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = adminSettings.FirstName,
            LastName = adminSettings.LastName,
            Email = adminSettings.Email,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,

            UpdatedAt = DateTime.UtcNow,

            CreatedBy = "System",

            UpdatedBy = "System"
        };

        var passwordHasher =
            new PasswordHasher<User>();

        adminUser.PasswordHash =
            passwordHasher.HashPassword(
            adminUser,
            adminSettings.Password);

        await context.Users
            .AddAsync(adminUser);

        await context.SaveChangesAsync();

        var userRole = new UserRole
        {
            Id = Guid.NewGuid(),

            UserId = adminUser.Id,

            RoleId = adminRole.Id,

            CreatedAt = DateTime.UtcNow,

            UpdatedAt = DateTime.UtcNow
        };

        await context.UserRoles
            .AddAsync(userRole);

        await context.SaveChangesAsync();
    }
}