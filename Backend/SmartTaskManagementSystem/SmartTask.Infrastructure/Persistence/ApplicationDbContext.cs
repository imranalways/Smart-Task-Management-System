using Microsoft.EntityFrameworkCore;
using SmartTask.Domain.Entities;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<Role> Roles => Set<Role>();

    public DbSet<UserRole> UserRoles => Set<UserRole>();

    public DbSet<RefreshToken> RefreshTokens =>
        Set<RefreshToken>();
    public DbSet<Project> Projects =>
    Set<Project>();
    public DbSet<ProjectMember> ProjectMembers =>
        Set<ProjectMember>();
    public DbSet<TaskItem> Tasks =>
    Set<TaskItem>();



    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);
    }
}