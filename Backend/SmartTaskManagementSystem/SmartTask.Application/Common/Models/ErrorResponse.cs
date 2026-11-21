using System;
using System.Collections.Generic;
using System.Text;

namespace SmartTask.Application.Common.Models
{
    public class ErrorResponse
    {
        public bool Success { get; set; }

        public string Message { get; set; } = string.Empty;

        public List<string> Errors { get; set; } = [];
    }
}
