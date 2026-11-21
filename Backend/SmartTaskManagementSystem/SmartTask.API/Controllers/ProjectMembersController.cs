using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SmartTask.Application.Features.ProjectMembers.DTOs;
using SmartTask.Application.Features.ProjectMembers.Services;

namespace SmartTask.API.Controllers;

[EnableRateLimiting("api")]
[ApiController]
[Authorize(Roles = "Admin,ProjectManager")]
[Route("api/projects/{projectId:guid}/members")]
public class ProjectMembersController
    : ControllerBase
{
    private readonly IProjectMemberService
        _projectMemberService;

    public ProjectMembersController(
        IProjectMemberService projectMemberService)
    {
        _projectMemberService =
            projectMemberService;
    }

    [HttpPost]
    public async Task<IActionResult> AddMember(
        Guid projectId,
        AddProjectMemberRequestDto request)
    {
        await _projectMemberService
            .AddMemberAsync(
                projectId,
                request.UserId);

        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> GetMembers(
        Guid projectId)
    {
        var result =
            await _projectMemberService
                .GetMembersAsync(
                    projectId);

        return Ok(result);
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> RemoveMember(
        Guid projectId,
        Guid userId)
    {
        await _projectMemberService
            .RemoveMemberAsync(
                projectId,
                userId);

        return NoContent();
    }
}