using Microsoft.EntityFrameworkCore;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Domain.Entities;
using SmartTask.Infrastructure.Persistence;

namespace SmartTask.Infrastructure.Repositories;

public class ProjectMemberRepository
    : IProjectMemberRepository
{
    private readonly ApplicationDbContext _context;

    public ProjectMemberRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(
        ProjectMember projectMember)
    {
        await _context.ProjectMembers
            .AddAsync(projectMember);
    }

    public async Task DeleteAsync(
        ProjectMember projectMember)
    {
        _context.ProjectMembers
            .Remove(projectMember);

        await Task.CompletedTask;
    }

    public async Task<ProjectMember?> GetAsync(
        Guid projectId,
        Guid userId)
    {
        return await _context.ProjectMembers
            .Include(x => x.User)
                .ThenInclude(x => x.UserRoles)
                    .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x =>
                x.ProjectId == projectId &&
                x.UserId == userId);
    }

    public async Task<bool> ExistsAsync(
        Guid projectId,
        Guid userId)
    {
        return await _context.ProjectMembers
            .AnyAsync(x =>
                x.ProjectId == projectId &&
                x.UserId == userId);
    }

    public async Task<List<ProjectMember>>
        GetMembersAsync(Guid projectId)
    {
        return await _context.ProjectMembers
            .Include(x => x.User)
                .ThenInclude(x => x.UserRoles)
                    .ThenInclude(x => x.Role)
            .Where(x =>
                x.ProjectId == projectId)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}