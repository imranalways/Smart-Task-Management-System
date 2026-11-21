using SmartTask.Application.Common.Models;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Application.Exceptions;
using SmartTask.Application.Features.Tasks.DTOs;
using SmartTask.Application.Features.Tasks.Services;
using SmartTask.Domain.Entities;
using SmartTask.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartTask.Infrastructure.Services
{
    public class TaskService : ITaskService
    {
        private readonly ITaskRepository _taskRepository;

        private readonly IProjectRepository _projectRepository;

        private readonly IProjectMemberRepository
            _projectMemberRepository;
        public TaskService(
    ITaskRepository taskRepository,
    IProjectRepository projectRepository,
    IProjectMemberRepository projectMemberRepository)
        {
            _taskRepository = taskRepository;

            _projectRepository = projectRepository;

            _projectMemberRepository =
                projectMemberRepository;
        }
        public async Task<TaskDto> CreateAsync(
    CreateTaskRequestDto request)
        {
            var project =
                await _projectRepository
                    .GetByIdAsync(
                        request.ProjectId);

            if (project is null)
            {
                throw new NotFoundException(
                    "Project not found.");
            }

            var task = new TaskItem
            {
                Id = Guid.NewGuid(),

                ProjectId = request.ProjectId,

                Title = request.Title,

                Description = request.Description,

                Priority = request.Priority,

                Status = TaskItemStatus.Todo,

                DueDate = request.DueDate,

                CreatedAt = DateTime.UtcNow,

                UpdatedAt = DateTime.UtcNow
            };

            await _taskRepository
                .AddAsync(task);

            await _taskRepository
                .SaveChangesAsync();

            return MapToDto(task);
        }
        public async Task<TaskDto>
            GetByIdAsync(Guid id)
        {
            var task =
                await _taskRepository
                    .GetByIdAsync(id);

            if (task is null)
            {
                throw new NotFoundException(
                    "Task not found.");
            }

            return MapToDto(task);
        }
        public async Task<TaskDto>
    UpdateAsync(
        UpdateTaskRequestDto request)
        {
            var task =
                await _taskRepository
                    .GetByIdAsync(request.Id);

            if (task is null)
            {
                throw new NotFoundException(
                    "Task not found.");
            }

            task.Title = request.Title;

            task.Description = request.Description;

            task.Priority = request.Priority;

            task.DueDate = request.DueDate;

            task.UpdatedAt = DateTime.UtcNow;

            await _taskRepository
                .UpdateAsync(task);

            await _taskRepository
                .SaveChangesAsync();

            return MapToDto(task);
        }
        public async Task DeleteAsync(Guid id)
        {
            var task =
                await _taskRepository
                    .GetByIdAsync(id);

            if (task is null)
            {
                throw new NotFoundException(
                    "Task not found.");
            }

            await _taskRepository
                .DeleteAsync(task);

            await _taskRepository
                .SaveChangesAsync();
        }
        public async Task AssignTaskAsync(
    Guid taskId,
    Guid userId)
        {
            var task =
                await _taskRepository
                    .GetByIdAsync(taskId);

            if (task is null)
            {
                throw new NotFoundException(
                    "Task not found.");
            }

            if (task.Status ==
                TaskItemStatus.Cancelled)
            {
                throw new BadRequestException(
                    "Cannot assign cancelled task.");
            }

            var memberExists =
                await _projectMemberRepository
                .ExistsAsync(
                    task.ProjectId,
                    userId);

            if (!memberExists)
            {
                throw new BadRequestException(
                    "User is not a project member.");
            }

            task.AssignedToUserId = userId;

            await _taskRepository
                .UpdateAsync(task);

            await _taskRepository
                .SaveChangesAsync();
        }

        public async Task UpdateStatusAsync(
    Guid taskId,
    UpdateTaskStatusRequestDto request)
        {
            var task =
                await _taskRepository
                    .GetByIdAsync(taskId);

            if (task is null)
            {
                throw new NotFoundException(
                    "Task not found.");
            }

            if (task.Status ==
                    TaskItemStatus.Completed
                &&
                request.Status ==
                    TaskItemStatus.Todo)
            {
                throw new BadRequestException(
                    "Completed task cannot return to Todo.");
            }

            task.Status = request.Status;

            task.UpdatedAt = DateTime.UtcNow;

            await _taskRepository
                .UpdateAsync(task);

            await _taskRepository
                .SaveChangesAsync();
        }
        public async Task<PagedResponse<TaskDto>>
    GetPagedAsync(
        PagedRequest request)
        {
            var pagedTasks =
                await _taskRepository
                    .GetPagedAsync(request);

            return new PagedResponse<TaskDto>
            {
                PageNumber = pagedTasks.PageNumber,

                PageSize = pagedTasks.PageSize,

                TotalRecords = pagedTasks.TotalRecords,

                TotalPages = pagedTasks.TotalPages,

                Items = pagedTasks.Items
                    .Select(MapToDto)
                    .ToList()
            };
        }
        private static TaskDto MapToDto(
    TaskItem task)
        {
            return new TaskDto
            {
                Id = task.Id,

                ProjectId = task.ProjectId,

                Title = task.Title,

                Description = task.Description,

                Status = task.Status.ToString(),

                Priority = task.Priority.ToString(),

                DueDate = task.DueDate,

                AssignedToUserId =
                    task.AssignedToUserId,

                AssignedToUserName =
                    task.AssignedToUser == null
                        ? string.Empty
                        : $"{task.AssignedToUser.FirstName} {task.AssignedToUser.LastName}"
            };
        }
    }
}
