
using Microsoft.EntityFrameworkCore;
using SmartTask.Application.Contracts.Services;
using SmartTask.Application.Features.Dashboard.DTOs;
using SmartTask.Application.Features.Dashboard.Services;
using SmartTask.Domain.Constants;
using SmartTask.Domain.Enums;
using SmartTask.Infrastructure.Persistence;

namespace SmartTask.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DashboardService(
        ApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync()
    {
        var userId = _currentUserService.UserId;
        var role = _currentUserService.Role;

        // Apply project visibility rules.
        var projectQuery = _context.Projects.AsQueryable();

        projectQuery = role switch
        {
            Roles.Admin => projectQuery,

            Roles.ProjectManager => projectQuery.Where(
                p => p.CreatedBy == userId
                || p.Members.Any(m => m.UserId == userId)),

            Roles.TeamMember => projectQuery.Where(
                p => p.Members.Any(m => m.UserId == userId)),

            _ => projectQuery.Where(p => false)
        };

        // Apply the same visibility rules to tasks.
        var taskQuery = _context.Tasks
            .Where(t => projectQuery.Any(p => p.Id == t.ProjectId));

        // Team Members only see their personally assigned tasks
        // in their accessible projects.
        if (role == Roles.TeamMember)
        {
            taskQuery = taskQuery.Where(
                t => t.AssignedToUserId == userId);
        }

        var totalProjects = await projectQuery.CountAsync();

        var totalTasks = await taskQuery.CountAsync();

        var completedTasks = await taskQuery.CountAsync(
            t => t.Status == TaskItemStatus.Completed);

        var pendingTasks = totalTasks - completedTasks;

        var tasksByStatus = await taskQuery
            .GroupBy(t => t.Status)
            .Select(group => new TaskStatusCountDto
            {
                Status = group.Key.ToString(),
                Count = group.Count()
            })
            .ToListAsync();

        var tasksByPriority = await taskQuery
            .GroupBy(t => t.Priority)
            .Select(group => new TaskPriorityCountDto
            {
                Priority = group.Key.ToString(),
                Count = group.Count()
            })
            .ToListAsync();

        var now = DateTime.UtcNow;
        var nextSevenDays = now.AddDays(7);

        var upcomingTasks = await taskQuery
            .Where(t =>
                t.DueDate >= now &&
                t.DueDate <= nextSevenDays &&
                t.Status != TaskItemStatus.Completed &&
                t.Status != TaskItemStatus.Cancelled)
            .OrderBy(t => t.DueDate)
            .Take(10)
            .Select(t => new UpcomingTaskDto
            {
                TaskId = t.Id,
                Title = t.Title,
                DueDate = t.DueDate,
                ProjectName = t.Project.Name
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
