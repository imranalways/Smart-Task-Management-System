using SmartTask.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartTask.Application.Features.Tasks.DTOs
{
    public class UpdateTaskStatusRequestDto
    {
        public TaskItemStatus Status { get; set; }
    }
}
