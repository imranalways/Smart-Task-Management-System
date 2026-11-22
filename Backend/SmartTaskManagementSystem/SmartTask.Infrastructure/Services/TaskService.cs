
using SmartTask.Application.Common.Models;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Application.Contracts.Services;
using SmartTask.Application.Exceptions;
using SmartTask.Application.Features.Tasks.DTOs;
using SmartTask.Application.Features.Tasks.Services;
using SmartTask.Domain.Constants;
using SmartTask.Domain.Entities;
using SmartTask.Domain.Enums;

namespace SmartTask.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IProjectRepository _projectRepository;
    private readonly IProjectMemberRepository _projectMemberRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public TaskService(
        ITaskRepository taskRepository,
        IProjectRepository projectRepository,
        IProjectMemberRepository projectMemberRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUserService)
    {
        _taskRepository = taskRepository;
        _projectRepository = projectRepository;
        _projectMemberRepository = projectMemberRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<TaskDto> CreateAsync(
        CreateTaskRequestDto request)
    {
        var project = await GetProjectForManagementAsync(
            request.ProjectId);

        var now = DateTime.UtcNow;

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            Status = TaskItemStatus.Todo,
            DueDate = request.DueDate,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _taskRepository.AddAsync(task);
        await _taskRepository.SaveChangesAsync();

        return MapToDto(task);
    }

    public async Task<TaskDto> GetByIdAsync(Guid id)
    {
        var task = await GetTaskForViewingAsync(id);
        return MapToDto(task);
    }

    public async Task<TaskDto> UpdateAsync(
        UpdateTaskRequestDto request)
    {
        var task = await GetTaskForManagementAsync(request.Id);

        task.Title = request.Title;
        task.Description = request.Description;
        task.Priority = request.Priority;
        task.DueDate = request.DueDate;
        task.UpdatedAt = DateTime.UtcNow;

        await _taskRepository.UpdateAsync(task);
        await _taskRepository.SaveChangesAsync();

        return MapToDto(task);
    }

    public async Task DeleteAsync(Guid id)
    {
        var task = await GetTaskForManagementAsync(id);

        await _taskRepository.DeleteAsync(task);
        await _taskRepository.SaveChangesAsync();
    }

    public async Task AssignTaskAsync(Guid taskId, Guid userId)
    {
        var task = await GetTaskForManagementAsync(taskId);

        if (task.Status == TaskItemStatus.Cancelled)
        {
            throw new BadRequestException(
                "Cannot assign a cancelled task.");
        }

        var user = await _userRepository.GetByIdAsync(userId);

        if (user is null)
        {
            throw new NotFoundException("User not found.");
        }

        if (!user.IsActive)
        {
            throw new BadRequestException(
                "Inactive users cannot be assigned tasks.");
        }

        var isTeamMember = user.UserRoles.Any(
            userRole => userRole.Role.Name == Roles.TeamMember);

        if (!isTeamMember)
        {
            throw new BadRequestException(
                "Tasks can only be assigned to Team Members.");
        }

        var isProjectMember =
            await _projectMemberRepository.ExistsAsync(
                task.ProjectId,
                userId);

        if (!isProjectMember)
        {
            throw new BadRequestException(
                "The assigned user must be a member of this project.");
        }

        task.AssignedToUserId = userId;
        task.UpdatedAt = DateTime.UtcNow;

        await _taskRepository.UpdateAsync(task);
        await _taskRepository.SaveChangesAsync();
    }

    public async Task UnassignTaskAsync(Guid taskId)
    {
        var task = await GetTaskForManagementAsync(taskId);

        task.AssignedToUserId = null;
        task.UpdatedAt = DateTime.UtcNow;

        await _taskRepository.UpdateAsync(task);
        await _taskRepository.SaveChangesAsync();
    }

    public async Task UpdateStatusAsync(
        Guid taskId,
        UpdateTaskStatusRequestDto request)
    {
        var task = await GetTaskForViewingAsync(taskId);

        var role = _currentUserService.Role;

        if (role == Roles.TeamMember)
        {
            if (task.AssignedToUserId != _currentUserService.UserId)
            {
                throw new ForbiddenException(
                    "You can only update the status of tasks assigned to you.");
            }
        }
        else
        {
            await EnsureCanManageTask(task);
        }

        if (task.Status == TaskItemStatus.Completed &&
            request.Status == TaskItemStatus.Todo)
        {
            throw new BadRequestException(
                "Completed task cannot return to Todo.");
        }

        task.Status = request.Status;
        task.UpdatedAt = DateTime.UtcNow;

        await _taskRepository.UpdateAsync(task);
        await _taskRepository.SaveChangesAsync();
    }

    public async Task<PagedResponse<TaskDto>> GetPagedAsync(
        PagedRequest request)
    {
        return await GetPagedTasksAsync(request, false);
    }

    public async Task<PagedResponse<TaskDto>> GetMyTasksAsync(
        PagedRequest request)
    {
        return await GetPagedTasksAsync(request, true);
    }

    private async Task<PagedResponse<TaskDto>> GetPagedTasksAsync(
        PagedRequest request,
        bool onlyMyTasks)
    {
        var pagedTasks =
            await _taskRepository.GetAccessiblePagedAsync(
                request,
                _currentUserService.UserId,
                _currentUserService.Role,
                onlyMyTasks);

        return new PagedResponse<TaskDto>
        {
            PageNumber = pagedTasks.PageNumber,
            PageSize = pagedTasks.PageSize,
            TotalRecords = pagedTasks.TotalRecords,
            TotalPages = pagedTasks.TotalPages,
            Items = pagedTasks.Items.Select(MapToDto).ToList()
        };
    }

    private async Task<TaskItem> GetTaskForViewingAsync(Guid id)
    {
        var task = await _taskRepository.GetByIdAsync(id);

        if (task is null)
        {
            throw new NotFoundException("Task not found.");
        }
        var projectMember = await _projectMemberRepository.GetMembersAsync(task.ProjectId);

        var role = _currentUserService.Role;

        var canView = role switch
        {
            Roles.Admin => true,

            Roles.ProjectManager => 
            (task.Project.CreatedBy == _currentUserService.UserId ||
             projectMember.Any(x => x.UserId == _currentUserService.UserId)),

            Roles.TeamMember =>
                await _projectMemberRepository.ExistsAsync(
                    task.ProjectId,
                    _currentUserService.UserId),

            _ => false
        };

        if (!canView)
        {
            throw new NotFoundException("Task not found.");
        }

        return task;
    }

    private async Task<TaskItem> GetTaskForManagementAsync(Guid id)
    {
        var task = await GetTaskForViewingAsync(id);
        await EnsureCanManageTask(task);
        return task;
    }

    private async Task EnsureCanManageTask(TaskItem task)
    {
        var role = _currentUserService.Role;
        var projectMember = await _projectMemberRepository.GetMembersAsync(task.ProjectId);

        if (role == Roles.Admin)
        {
            return;
        }

        if (role == Roles.ProjectManager &&
            task.Project.CreatedBy == _currentUserService.UserId ||
            projectMember.Any(x => x.UserId == _currentUserService.UserId))
        {
            return;
        }

        throw new ForbiddenException(
            "You do not have permission to manage this task.");
    }

    private async Task<Project> GetProjectForManagementAsync(
        Guid projectId)
    {
        var project = await _projectRepository.GetByIdAsync(projectId);

        if (project is null)
        {
            throw new NotFoundException("Project not found.");
        }
        var projectMember = await _projectMemberRepository.GetMembersAsync(projectId);
        var role = _currentUserService.Role;

        if (role == Roles.Admin)
        {
            return project;
        }

        if (role == Roles.ProjectManager
            &&
            (project.CreatedBy == _currentUserService.UserId || projectMember.Any(m => m.UserId == _currentUserService.UserId)))
        {
            return project;
        }

        throw new ForbiddenException(
            "You do not have permission to create tasks in this project.");
    }

    private static TaskDto MapToDto(TaskItem task)
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
            AssignedToUserId = task.AssignedToUserId,
            AssignedToUserName = task.AssignedToUser == null
                ? string.Empty
                : $"{task.AssignedToUser.FirstName} {task.AssignedToUser.LastName}"
        };
    }
}
