
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SmartTask.Application.Common.Models;
using SmartTask.Application.Contracts.Services;
using SmartTask.Application.Features.Projects.DTOs;
using SmartTask.Domain.Constants;

namespace SmartTask.API.Controllers
{
    [EnableRateLimiting("api")]
    [ApiController]
    [Route("api/projects")]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectService _projectService;

        public ProjectsController(IProjectService projectService)
        {
            _projectService = projectService;
        }

        // Admin and ProjectManager can create projects
        [HttpPost]
        [Authorize(Roles = $"{Roles.Admin},{Roles.ProjectManager}")]
        public async Task<IActionResult> Create(
            CreateProjectRequestDto request)
        {
            var result = await _projectService.CreateAsync(request);

            return Ok(new ApiResponse<ProjectDto>
            {
                Success = true,
                Message = "Project created successfully.",
                Data = result
            });
        }

        // All authenticated users can view projects
        [HttpGet]
        public async Task<IActionResult> GetProjects(
            [FromQuery] PagedRequest request)
        {
            var result = await _projectService.GetPagedAsync(request);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Projects retrieved successfully.",
                Data = result
            });
        }

        // All authenticated users can view project details
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _projectService.GetByIdAsync(id);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Project retrieved successfully.",
                Data = result
            });
        }

        // Admin and ProjectManager can update projects
        [HttpPut("{id:guid}")]
        [Authorize(Roles = $"{Roles.Admin},{Roles.ProjectManager}")]
        public async Task<IActionResult> Update(
            Guid id,
            UpdateProjectRequestDto request)
        {
            request.Id = id;

            var result = await _projectService.UpdateAsync(request);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Project updated successfully.",
                Data = result
            });
        }

        // Admin and ProjectManager can delete projects
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = $"{Roles.Admin},{Roles.ProjectManager}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _projectService.DeleteAsync(id);

            return NoContent();
        }
    }
}
