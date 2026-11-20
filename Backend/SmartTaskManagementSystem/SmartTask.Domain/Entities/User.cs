using SmartTask.Domain.Common;

namespace SmartTask.Domain.Entities;

public class User : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public Guid RoleId { get; set; }

    public bool IsActive { get; set; } = true;

    public Role Role { get; set; } = null!;

    public ICollection<RefreshToken> RefreshTokens { get; set; }
        = new List<RefreshToken>();
}