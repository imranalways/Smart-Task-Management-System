using Microsoft.EntityFrameworkCore;
using SmartTask.Application.Common.Models;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Domain.Constants;
using SmartTask.Domain.Entities;

public class ProjectRepository : IProjectRepository
{
    private readonly ApplicationDbContext _context;

    public ProjectRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Project project)
    {
        await _context.Projects.AddAsync(project);
    }

    public async Task UpdateAsync(Project project)
    {
        _context.Projects.Update(project);

        await Task.CompletedTask;
    }

    public async Task DeleteAsync(Project project)
    {
        _context.Projects.Remove(project);

        await Task.CompletedTask;
    }

    public async Task<Project?> GetByIdAsync(Guid id)
    {
        return await _context.Projects
            .Include(x => x.CreatedByUser)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task<PagedResponse<Project>> GetPagedAsync(
        PagedRequest request)
    {
        IQueryable<Project> query =
            _context.Projects
                .Include(x => x.CreatedByUser)
                .AsQueryable();

        // Search
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();

            query = query.Where(x =>
                x.Name.Contains(search) ||
                x.Description.Contains(search));
        }

        // Sorting
        query = request.SortBy?.ToLower() switch
        {
            "name" => request.Descending
                ? query.OrderByDescending(x => x.Name)
                : query.OrderBy(x => x.Name),

            "status" => request.Descending
                ? query.OrderByDescending(x => x.Status)
                : query.OrderBy(x => x.Status),

            "startdate" => request.Descending
                ? query.OrderByDescending(x => x.StartDate)
                : query.OrderBy(x => x.StartDate),

            "enddate" => request.Descending
                ? query.OrderByDescending(x => x.EndDate)
                : query.OrderBy(x => x.EndDate),

            _ => query.OrderByDescending(x => x.CreatedAt)
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

        return new PagedResponse<Project>
        {
            Items = items,

            PageNumber = request.PageNumber,

            PageSize = request.PageSize,

            TotalRecords = totalRecords,

            TotalPages =
                (int)Math.Ceiling(
                    totalRecords /
                    (double)request.PageSize)
        };
    }
    public async Task<Project?> GetAccessibleByIdAsync(
    Guid id,
    Guid userId,
    string role)
    {
        IQueryable<Project> query = _context.Projects
            .Include(x => x.CreatedByUser)
            .AsQueryable();

        query = ApplyAccessFilter(query, userId, role);

        return await query.FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<PagedResponse<Project>> GetAccessiblePagedAsync(
        PagedRequest request,
        Guid userId,
        string role)
    {
        IQueryable<Project> query = _context.Projects
            .Include(x => x.CreatedByUser)
            .AsQueryable();

        query = ApplyAccessFilter(query, userId, role);

        // Search
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();

            query = query.Where(x =>
                x.Name.Contains(search) ||
                x.Description.Contains(search));
        }

        // Sorting
        query = request.SortBy?.ToLower() switch
        {
            "name" => request.Descending
                ? query.OrderByDescending(x => x.Name)
                : query.OrderBy(x => x.Name),

            "status" => request.Descending
                ? query.OrderByDescending(x => x.Status)
                : query.OrderBy(x => x.Status),

            "startdate" => request.Descending
                ? query.OrderByDescending(x => x.StartDate)
                : query.OrderBy(x => x.StartDate),

            "enddate" => request.Descending
                ? query.OrderByDescending(x => x.EndDate)
                : query.OrderBy(x => x.EndDate),

            _ => query.OrderByDescending(x => x.CreatedAt)
        };

        var totalRecords = await query.CountAsync();

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return new PagedResponse<Project>
        {
            Items = items,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalRecords = totalRecords,
            TotalPages = (int)Math.Ceiling(
                totalRecords / (double)request.PageSize)
        };
    }

    private static IQueryable<Project> ApplyAccessFilter(
        IQueryable<Project> query,
        Guid userId,
        string role)
    {
        return role switch
        {
            Roles.Admin => query,

            Roles.ProjectManager => query.Where(
                x => x.CreatedBy == userId
                || x.Members.Any(m => m.UserId == userId)),

            Roles.TeamMember => query.Where(
                x => x.Members.Any(m => m.UserId == userId)),

            _ => query.Where(x => false)
        };
    }
}