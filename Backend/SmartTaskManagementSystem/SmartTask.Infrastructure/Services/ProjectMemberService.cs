using SmartTask.Application.Contracts.Persistence;
using SmartTask.Application.Contracts.Services;
using SmartTask.Application.Exceptions;
using SmartTask.Application.Features.ProjectMembers.DTOs;
using SmartTask.Application.Features.ProjectMembers.Services;
using SmartTask.Domain.Constants;
using SmartTask.Domain.Entities;

namespace SmartTask.Infrastructure.Services;

public class ProjectMemberService : IProjectMemberService
{
    private readonly IProjectRepository _projectRepository;
    private readonly IUserRepository _userRepository;
    private readonly IProjectMemberRepository _projectMemberRepository;
    private readonly ITaskRepository _taskRepository;
    private readonly ICurrentUserService _currentUserService;

    public ProjectMemberService(
        IProjectRepository projectRepository,
        IUserRepository userRepository,
        IProjectMemberRepository projectMemberRepository,
        ITaskRepository taskRepository,
        ICurrentUserService currentUserService)
    {
        _projectRepository = projectRepository;
        _userRepository = userRepository;
        _projectMemberRepository = projectMemberRepository;
        _taskRepository = taskRepository;
        _currentUserService = currentUserService;
    }

    public async Task AddMemberAsync(
        Guid projectId,
        Guid userId)
    {
        // Only Admin or the owning Project Manager
        // can manage this project's membership.
        await GetProjectForManagementAsync(projectId);

        var user = await _userRepository.GetByIdAsync(userId);

        if (user is null)
            throw new NotFoundException("User not found.");

        if (!user.IsActive)
            throw new BadRequestException(
                "Inactive users cannot be assigned to a project.");
        var isTeamMember = true;
        if (_currentUserService.Role != Roles.Admin)
        {
            isTeamMember = user.UserRoles.Any(userRole =>
            userRole.Role.Name == Roles.TeamMember);
        }
        

        if (!isTeamMember)
            throw new BadRequestException(
                "Only users with the Team Member role can be assigned to a project.");

        var exists = await _projectMemberRepository.ExistsAsync(
            projectId,
            userId);

        if (exists)
            throw new BadRequestException(
                "User is already assigned to this project.");

        var now = DateTime.UtcNow;

        var member = new ProjectMember
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            UserId = userId,
            JoinedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _projectMemberRepository.AddAsync(member);
        await _projectMemberRepository.SaveChangesAsync();
    }

    public async Task RemoveMemberAsync(
        Guid projectId,
        Guid userId)
    {
        await GetProjectForManagementAsync(projectId);

        var member = await _projectMemberRepository.GetAsync(
            projectId,
            userId);

        if (member is null)
            throw new NotFoundException(
                "Project member not found.");

        var hasActiveTasks =
            await _taskRepository
                .HasActiveTasksAssignedToUserInProjectAsync(
                    projectId,
                    userId);

        if (hasActiveTasks)
        {
            throw new BadRequestException(
                "This member has active assigned tasks. " +
                "Please reassign or resolve those tasks before removing the member.");
        }

        await _projectMemberRepository.DeleteAsync(member);
        await _projectMemberRepository.SaveChangesAsync();
    }

    public async Task<List<ProjectMemberDto>> GetMembersAsync(
        Guid projectId)
    {
        await GetProjectForManagementAsync(projectId);

        var members = await _projectMemberRepository.GetMembersAsync(
            projectId);

        return members.Select(member => new ProjectMemberDto
        {
            UserId = member.UserId,

            FullName =
                $"{member.User.FirstName} {member.User.LastName}",

            Email = member.User.Email,

            JoinedAt = member.JoinedAt,

            Role = member.User.UserRoles
                .FirstOrDefault()?
                .Role.Name ?? string.Empty

        }).ToList();
    }

    private async Task<Project> GetProjectForManagementAsync(
        Guid projectId)
    {
        var project = await _projectRepository.GetByIdAsync(projectId);

        if (project is null)
            throw new NotFoundException("Project not found.");

        // System Admin can manage every project.
        if (_currentUserService.Role == Roles.Admin)
            return project;

        // Project Managers can manage only projects they created.
        if (_currentUserService.Role == Roles.ProjectManager &&
            project.CreatedBy == _currentUserService.UserId)
        {
            return project;
        }

        throw new ForbiddenException(
            "You do not have permission to manage this project's members.");
    }
}