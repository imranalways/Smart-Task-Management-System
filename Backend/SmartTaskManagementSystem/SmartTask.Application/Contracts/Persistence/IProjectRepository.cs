using SmartTask.Application.Common.Models;
using SmartTask.Domain.Entities;

namespace SmartTask.Application.Contracts.Persistence;

public interface IProjectRepository
{
    Task AddAsync(Project project);

    Task UpdateAsync(Project project);

    Task DeleteAsync(Project project);

    Task<Project?> GetByIdAsync(Guid id);
    Task<Project?> GetAccessibleByIdAsync(
    Guid id,
    Guid userId,
    string role);

    Task<PagedResponse<Project>> GetAccessiblePagedAsync(
        PagedRequest request,
        Guid userId,
        string role);
    Task<PagedResponse<Project>> GetPagedAsync(
        PagedRequest request);

    Task SaveChangesAsync();
}