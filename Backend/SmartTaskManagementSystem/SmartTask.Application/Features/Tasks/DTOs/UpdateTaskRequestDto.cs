using SmartTask.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartTask.Application.Features.Tasks.DTOs
{
    public class UpdateTaskRequestDto
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public TaskPriority Priority { get; set; }

        public DateTime DueDate { get; set; }
    }
}
