
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SmartTask.Application.Common.Models;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Domain.Constants;

namespace SmartTask.API.Controllers;

[EnableRateLimiting("api")]
[ApiController]
[Authorize(Roles = Roles.Admin)]
[Route("api/admin/user-roles")]
public class UserRolesController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IUserRoleRepository _userRoleRepository;

    public UserRolesController(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IUserRoleRepository userRoleRepository)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userRepository.GetAllAsync();

        var result = users.Select(user => new
        {
            user.Id,
            FullName = $"{user.FirstName} {user.LastName}".Trim(),
            user.Email,
            IsActive = user.IsActive,
            Role = user.UserRoles
                .Select(x => x.Role.Name)
                .FirstOrDefault() ?? Roles.TeamMember
        }).ToList();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Users retrieved successfully.",
            Data = result
        });
    }

    [HttpGet("roles")]
    public IActionResult GetRoles()
    {
        var roles = new[]
        {
            new { Name = Roles.Admin, DisplayName = "System Admin" },
            new { Name = Roles.ProjectManager, DisplayName = "Project Manager" },
            new { Name = Roles.TeamMember, DisplayName = "Team Member" }
        };

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Roles retrieved successfully.",
            Data = roles
        });
    }

    [HttpPut("users/{userId:guid}")]
    public async Task<IActionResult> UpdateUserRole(
        Guid userId,
        [FromBody] UpdateUserRoleRequest request)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "User not found."
            });
        }

        if (!user.IsActive)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Cannot assign a role to an inactive user."
            });
        }

        var role = await _roleRepository.GetByNameAsync(request.Role);

        if (role == null)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Invalid role selected."
            });
        }

        await _userRoleRepository.ReplaceRoleAsync(userId, role.Id);
        await _userRoleRepository.SaveChangesAsync();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "User role updated successfully.",
            Data = new
            {
                UserId = userId,
                Role = role.Name
            }
        });
    }
}

public class UpdateUserRoleRequest
{
    public string Role { get; set; } = string.Empty;
}
