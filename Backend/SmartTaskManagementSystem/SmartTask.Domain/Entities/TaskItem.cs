using SmartTask.Domain.Common;
using SmartTask.Domain.Enums;

namespace SmartTask.Domain.Entities;

public class TaskItem : AuditableEntity
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public Guid ProjectId { get; set; }

    public Guid? AssignedToUserId { get; set; }

    public TaskItemStatus Status { get; set; }

    public TaskPriority Priority { get; set; }

    public DateTime DueDate { get; set; }

    public Project Project { get; set; } = null!;

    public User? AssignedToUser { get; set; }
}