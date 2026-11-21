using Microsoft.EntityFrameworkCore;
using SmartTask.Application.Features.Dashboard.DTOs;
using SmartTask.Application.Features.Dashboard.Services;
using SmartTask.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartTask.Infrastructure.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly ApplicationDbContext _context;

        public DashboardService(
            ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<DashboardSummaryDto>
    GetSummaryAsync()
        {
            var totalProjects =
                await _context.Projects.CountAsync();

            var totalTasks =
                await _context.Tasks.CountAsync();

            var completedTasks =
                await _context.Tasks
                    .CountAsync(x =>
                        x.Status ==
                        TaskItemStatus.Completed);

            var pendingTasks =
                totalTasks - completedTasks;
            var tasksByStatus =
    await _context.Tasks
        .GroupBy(x => x.Status)
        .Select(x =>
            new TaskStatusCountDto
            {
                Status =
                    x.Key.ToString(),

                Count =
                    x.Count()
            })
        .ToListAsync();

            var tasksByPriority =
    await _context.Tasks
        .GroupBy(x => x.Priority)
        .Select(x =>
            new TaskPriorityCountDto
            {
                Priority =
                    x.Key.ToString(),

                Count =
                    x.Count()
            })
        .ToListAsync();

            var upcomingTasks =
    await _context.Tasks
    .Include(x => x.Project)
    .Where(x =>
        x.DueDate >= DateTime.UtcNow
        &&
        x.DueDate <=
            DateTime.UtcNow.AddDays(7))
    .OrderBy(x => x.DueDate)
    .Take(10)
    .Select(x =>
        new UpcomingTaskDto
        {
            TaskId = x.Id,

            Title = x.Title,

            DueDate = x.DueDate,

            ProjectName =
                x.Project.Name
        })
    .ToListAsync();

            return new DashboardSummaryDto
            {
                TotalProjects = totalProjects,

                TotalTasks = totalTasks,

                CompletedTasks = completedTasks,

                PendingTasks = pendingTasks,

                TasksByStatus = tasksByStatus,

                TasksByPriority = tasksByPriority,

                UpcomingDueTasks = upcomingTasks
            };
        }
    }
}
