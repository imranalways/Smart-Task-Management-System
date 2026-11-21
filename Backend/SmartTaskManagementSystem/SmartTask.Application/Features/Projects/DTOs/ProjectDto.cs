namespace SmartTask.Application.Features.Projects.DTOs;

public class ProjectDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public Guid CreatedBy { get; set; }

    public string CreatedByName { get; set; } = string.Empty;
}