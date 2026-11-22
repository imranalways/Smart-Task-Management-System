using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SmartTask.Application.Common.Models;
using SmartTask.Application.Features.Projects.DTOs;
using SmartTask.Application.Features.Tasks.DTOs;
using SmartTask.Application.Features.Tasks.Services;
using SmartTask.Domain.Constants;

namespace SmartTask.API.Controllers;

[EnableRateLimiting("api")]
[ApiController]
[Authorize]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(
        ITaskService taskService)
    {
        _taskService = taskService;
    }
    [Authorize(Roles = $"{Roles.Admin},{Roles.ProjectManager}")]
    [HttpPost]
    public async Task<IActionResult> Create(
        CreateTaskRequestDto request)
    {
        var result =
            await _taskService.CreateAsync(
                request);

        return Ok(
                new ApiResponse<TaskDto>
                {
                    Success = true,

                    Message =
                        "Task created successfully.",

                    Data = result
                });
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks(
        [FromQuery] PagedRequest request)
    {
        var result =
            await _taskService.GetPagedAsync(
                request);

        return Ok(
            new ApiResponse<object>
            {
                Success = true,

                Message =
                    "Tasks retrieved successfully.",

                Data = result
            });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(
        Guid id)
    {
        var result =
            await _taskService.GetByIdAsync(
                id);

        return Ok(
            new ApiResponse<object>
            {
                Success = true,

                Message =
                    "Task retrieved successfully.",

                Data = result
            });
    }
    [Authorize(Roles = $"{Roles.Admin},{Roles.ProjectManager}")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateTaskRequestDto request)
    {
        request.Id = id;

        var result =
            await _taskService.UpdateAsync(
                request);

        return Ok(
            new ApiResponse<object>
            {
                Success = true,

                Message =
                    "Task updated successfully.",

                Data = result
            });
    }
    [Authorize(Roles = $"{Roles.Admin},{Roles.ProjectManager}")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id)
    {
        await _taskService.DeleteAsync(id);

        return NoContent();
    }
    [Authorize(Roles = $"{Roles.Admin},{Roles.ProjectManager}")]
    [HttpPost("{taskId:guid}/assign")]
    public async Task<IActionResult> AssignTask(
        Guid taskId,
        AssignTaskRequestDto request)
    {
        await _taskService.AssignTaskAsync(
            taskId,
            request.UserId);

        return Ok(
            new ApiResponse<object>
            {
                Success = true,

                Message =
                    "Task assigned successfully.",

                Data = null
            });
    }

    [HttpPut("{taskId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid taskId,
        UpdateTaskStatusRequestDto request)
    {
        await _taskService.UpdateStatusAsync(
            taskId,
            request);

        return Ok(
            new ApiResponse<object>
            {
                Success = true,

                Message =
                    "Task status updated successfully.",

                Data = null
            });
    }
    [HttpGet("my")]
    public async Task<IActionResult> GetMyTasks(
    [FromQuery] PagedRequest request)
    {
        var result = await _taskService.GetMyTasksAsync(request);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "My tasks retrieved successfully.",
            Data = result
        });
    }
}