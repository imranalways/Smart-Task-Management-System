using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartTask.Application.Common.Models;
using SmartTask.Application.Contracts.Services;
using SmartTask.Application.Features.Projects.DTOs;

namespace SmartTask.API.Controllers
{
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

        [HttpPost]
        public async Task<IActionResult> Create(
    CreateProjectRequestDto request)
        {
            var result =
                await _projectService
                    .CreateAsync(request);

            return Ok(result);
        }
        [HttpGet]
        public async Task<IActionResult> GetProjects(
    [FromQuery] PagedRequest request)
        {
            var result =
                await _projectService
                    .GetPagedAsync(request);

            return Ok(result);
        }
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(
    Guid id)
        {
            var result =
                await _projectService
                    .GetByIdAsync(id);

            return Ok(result);
        }
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(
    Guid id,
    UpdateProjectRequestDto request)
        {
            request.Id = id;

            var result =
                await _projectService
                    .UpdateAsync(request);

            return Ok(result);
        }
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(
    Guid id)
        {
            await _projectService.DeleteAsync(id);

            return NoContent();
        }
    }
}
