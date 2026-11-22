using SmartTask.Application.Common.Models;
using SmartTask.Application.Features.Tasks.DTOs;
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
    Task<bool> HasActiveTasksAssignedToUserInProjectAsync(
    Guid projectId,
    Guid userId);

    Task<PagedResponse<TaskItem>> GetAccessiblePagedAsync(
    PagedRequest request,
    Guid userId,
    string role,
    bool onlyMyTasks);

    Task SaveChangesAsync();
}