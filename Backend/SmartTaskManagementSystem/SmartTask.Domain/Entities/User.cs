using SmartTask.Domain.Common;

namespace SmartTask.Domain.Entities;

public class User : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<RefreshToken> RefreshTokens { get; set; }
        = new List<RefreshToken>();
    public ICollection<UserRole> UserRoles { get; set; }
    = new List<UserRole>();
    public ICollection<ProjectMember> ProjectMemberships
    { get; set; }
    = new List<ProjectMember>();
    public ICollection<TaskItem> AssignedTasks
    {
        get;
        set;
    }
    = new List<TaskItem>();
}