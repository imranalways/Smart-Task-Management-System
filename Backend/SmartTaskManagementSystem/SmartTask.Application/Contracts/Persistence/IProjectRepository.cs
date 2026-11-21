using SmartTask.Application.Common.Models;
using SmartTask.Domain.Entities;

namespace SmartTask.Application.Contracts.Persistence;

public interface IProjectRepository
{
    Task AddAsync(Project project);

    Task UpdateAsync(Project project);

    Task DeleteAsync(Project project);

    Task<Project?> GetByIdAsync(Guid id);

    Task<PagedResponse<Project>> GetPagedAsync(
        PagedRequest request);

    Task SaveChangesAsync();
}