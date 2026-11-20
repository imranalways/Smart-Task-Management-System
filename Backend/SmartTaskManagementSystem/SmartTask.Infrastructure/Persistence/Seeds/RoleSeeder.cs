using SmartTask.Domain.Entities;

namespace SmartTask.Infrastructure.Persistence.Seeds;

public static class RoleSeeder
{
    public static readonly Guid AdminRoleId =
        Guid.Parse("11111111-1111-1111-1111-111111111111");

    public static readonly Guid ProjectManagerRoleId =
        Guid.Parse("22222222-2222-2222-2222-222222222222");

    public static readonly Guid TeamMemberRoleId =
        Guid.Parse("33333333-3333-3333-3333-333333333333");

    public static IEnumerable<Role> Roles =>
        new List<Role>
        {
            new()
            {
                Id = AdminRoleId,
                Name = "Admin"
            },

            new()
            {
                Id = ProjectManagerRoleId,
                Name = "ProjectManager"
            },

            new()
            {
                Id = TeamMemberRoleId,
                Name = "TeamMember"
            }
        };
}