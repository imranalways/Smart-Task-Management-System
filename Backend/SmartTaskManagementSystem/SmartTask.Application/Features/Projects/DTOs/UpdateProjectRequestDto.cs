using SmartTask.Domain.Enums;

namespace SmartTask.Application.Features.Projects.DTOs;

public class UpdateProjectRequestDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}