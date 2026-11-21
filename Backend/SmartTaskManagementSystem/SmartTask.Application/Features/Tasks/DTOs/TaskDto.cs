using System;
using System.Collections.Generic;
using System.Text;

namespace SmartTask.Application.Features.Tasks.DTOs
{
    public class TaskDto
    {
        public Guid Id { get; set; }

        public Guid ProjectId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string Priority { get; set; } = string.Empty;

        public DateTime DueDate { get; set; }

        public Guid? AssignedToUserId { get; set; }

        public string AssignedToUserName { get; set; } = string.Empty;
    }
}
