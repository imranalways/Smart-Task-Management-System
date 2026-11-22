using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SmartTask.Application.Common.Models;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Application.Features.Users.DTOs;
using SmartTask.Domain.Constants;

namespace SmartTask.API.Controllers;

[EnableRateLimiting("api")]
[ApiController]
[Authorize(Roles = $"{Roles.Admin},{Roles.ProjectManager}")]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public UsersController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userRepository.GetAllAsync();

        var result = users.Where(x => x.IsActive).Select(user => new UserDirectoryDto
        {
            Id = user.Id,
            FullName = $"{user.FirstName} {user.LastName}",
            Email = user.Email,
            Role = user.UserRoles
                .FirstOrDefault()?
                .Role.Name ?? string.Empty
        }).ToList();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Users retrieved successfully.",
            Data = result
        });
    }
}