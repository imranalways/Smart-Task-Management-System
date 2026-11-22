using Microsoft.EntityFrameworkCore;
using SmartTask.Application.Common.Models;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Domain.Constants;
using SmartTask.Domain.Entities;
using SmartTask.Domain.Enums;
using SmartTask.Infrastructure.Persistence;

namespace SmartTask.Infrastructure.Repositories;

public class TaskRepository
    : ITaskRepository
{
    private readonly ApplicationDbContext _context;

    public TaskRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(TaskItem task)
    {
        await _context.Tasks.AddAsync(task);
    }

    public async Task UpdateAsync(TaskItem task)
    {
        _context.Tasks.Update(task);

        await Task.CompletedTask;
    }

    public async Task DeleteAsync(TaskItem task)
    {
        _context.Tasks.Remove(task);

        await Task.CompletedTask;
    }

    public async Task<TaskItem?> GetByIdAsync(
        Guid id)
    {
        return await _context.Tasks
            .Include(x => x.Project)
            .Include(x => x.AssignedToUser)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
    public async Task<PagedResponse<TaskItem>>
    GetPagedAsync(
        PagedRequest request)
    {
        IQueryable<TaskItem> query =
            _context.Tasks
            .Include(x => x.Project)
            .Include(x => x.AssignedToUser);

        if (!string.IsNullOrWhiteSpace(
            request.Search))
        {
            query = query.Where(x =>
                x.Title.Contains(
                    request.Search) ||
                x.Description.Contains(
                    request.Search));
        }

        query = request.SortBy?.ToLower()
            switch
        {
            "title" =>
                request.Descending
                ? query.OrderByDescending(
                    x => x.Title)
                : query.OrderBy(
                    x => x.Title),

            "duedate" =>
                request.Descending
                ? query.OrderByDescending(
                    x => x.DueDate)
                : query.OrderBy(
                    x => x.DueDate),

            _ => query.OrderByDescending(
                    x => x.CreatedAt)
        };

        var totalRecords =
            await query.CountAsync();

        var items =
            await query
            .Skip(
                (request.PageNumber - 1)
                * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return new PagedResponse<TaskItem>
        {
            Items = items,

            PageNumber =
                request.PageNumber,

            PageSize =
                request.PageSize,

            TotalRecords =
                totalRecords,

            TotalPages =
                (int)Math.Ceiling(
                    totalRecords /
                    (double)request.PageSize)
        };
    }
    public async Task<bool>
    HasActiveTasksAssignedToUserInProjectAsync(
        Guid projectId,
        Guid userId)
    {
        return await _context.Tasks.AnyAsync(task =>
            task.ProjectId == projectId &&
            task.AssignedToUserId == userId &&
            task.Status != TaskItemStatus.Completed &&
            task.Status != TaskItemStatus.Cancelled);
    }
    public async Task<PagedResponse<TaskItem>> GetAccessiblePagedAsync(
    PagedRequest request,
    Guid userId,
    string role,
    bool onlyMyTasks)
    {
        IQueryable<TaskItem> query = _context.Tasks
            .Include(x => x.Project)
            .Include(x => x.AssignedToUser);

        query = role switch
        {
            Roles.Admin => query,

            Roles.ProjectManager => query.Where(
                x => x.Project.CreatedBy == userId
                || x.Project.Members.Any(m => m.UserId == userId)),

            Roles.TeamMember => query.Where(
                x => x.Project.Members.Any(m => m.UserId == userId)),

            _ => query.Where(x => false)
        };
        // Filter by project
        if (request.ProjectId.HasValue)
        {
            query = query.Where(
                x => x.ProjectId == request.ProjectId.Value);
        }

        // Show only unassigned tasks
        if (request.UnassignedOnly)
        {
            query = query.Where(
                x => x.AssignedToUserId == null);
        }

        if (onlyMyTasks)
        {
            query = query.Where(
                x => x.AssignedToUserId == userId);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();

            query = query.Where(x =>
                x.Title.Contains(search) ||
                x.Description.Contains(search));
        }

        query = request.SortBy?.ToLower() switch
        {
            "title" => request.Descending
                ? query.OrderByDescending(x => x.Title)
                : query.OrderBy(x => x.Title),

            "duedate" => request.Descending
                ? query.OrderByDescending(x => x.DueDate)
                : query.OrderBy(x => x.DueDate),

            "status" => request.Descending
                ? query.OrderByDescending(x => x.Status)
                : query.OrderBy(x => x.Status),

            "priority" => request.Descending
                ? query.OrderByDescending(x => x.Priority)
                : query.OrderBy(x => x.Priority),

            _ => query.OrderByDescending(x => x.CreatedAt)
        };

        var totalRecords = await query.CountAsync();

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return new PagedResponse<TaskItem>
        {
            Items = items,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalRecords = totalRecords,
            TotalPages = (int)Math.Ceiling(
                totalRecords / (double)request.PageSize)
        };
    }
}