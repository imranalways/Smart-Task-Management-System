using SmartTask.Domain.Common;

namespace SmartTask.Domain.Entities;

public class ProjectMember : BaseEntity
{
    public Guid ProjectId { get; set; }

    public Guid UserId { get; set; }

    public DateTime JoinedAt { get; set; }

    public Project Project { get; set; } = null!;

    public User User { get; set; } = null!;
}