using SmartTask.Application.Common.Models;
using SmartTask.Application.Features.Tasks.DTOs;

namespace SmartTask.Application.Features.Tasks.Services;

public interface ITaskService
{
    Task<TaskDto> CreateAsync(
        CreateTaskRequestDto request);

    Task<TaskDto> UpdateAsync(
        UpdateTaskRequestDto request);

    Task DeleteAsync(Guid id);

    Task<TaskDto> GetByIdAsync(Guid id);

    Task<PagedResponse<TaskDto>>
        GetPagedAsync(
            PagedRequest request);

    Task AssignTaskAsync(
        Guid taskId,
        Guid userId);

    Task UpdateStatusAsync(
        Guid taskId,
        UpdateTaskStatusRequestDto request);
    Task<PagedResponse<TaskDto>> GetMyTasksAsync(
    PagedRequest request);
}