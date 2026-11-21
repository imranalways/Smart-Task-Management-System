using Microsoft.EntityFrameworkCore;
using SmartTask.Application.Common.Models;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Domain.Entities;
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
}