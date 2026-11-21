public class UpcomingTaskDto
{
    public Guid TaskId { get; set; }

    public string Title { get; set; } = string.Empty;

    public DateTime DueDate { get; set; }

    public string ProjectName { get; set; }
        = string.Empty;
}