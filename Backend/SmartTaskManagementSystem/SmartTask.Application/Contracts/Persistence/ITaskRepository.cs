using SmartTask.Application.Common.Models;
using SmartTask.Domain.Entities;

namespace SmartTask.Application.Contracts.Persistence;

public interface ITaskRepository
{
    Task AddAsync(TaskItem task);

    Task UpdateAsync(TaskItem task);

    Task DeleteAsync(TaskItem task);

    Task<TaskItem?> GetByIdAsync(Guid id);

    Task<PagedResponse<TaskItem>>
        GetPagedAsync(
            PagedRequest request);

    Task SaveChangesAsync();
}