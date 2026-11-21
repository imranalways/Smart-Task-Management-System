namespace SmartTask.Application.Features.Dashboard.DTOs;

public class DashboardSummaryDto
{
    public int TotalProjects { get; set; }

    public int TotalTasks { get; set; }

    public int CompletedTasks { get; set; }

    public int PendingTasks { get; set; }

    public List<TaskStatusCountDto>
        TasksByStatus
    { get; set; } = [];

    public List<TaskPriorityCountDto>
        TasksByPriority
    { get; set; } = [];

    public List<UpcomingTaskDto>
        UpcomingDueTasks
    { get; set; } = [];
}