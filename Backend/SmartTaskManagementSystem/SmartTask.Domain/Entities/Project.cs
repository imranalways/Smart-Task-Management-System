using SmartTask.Domain.Common;
using SmartTask.Domain.Enums;

namespace SmartTask.Domain.Entities;

public class Project : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public Guid CreatedBy { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public ICollection<ProjectMember> Members { get; set; }
        = new List<ProjectMember>();
    public ICollection<TaskItem> Tasks { get; set; }
    = new List<TaskItem>();
}