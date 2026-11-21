using SmartTask.Application.Contracts.Persistence;
using SmartTask.Application.Exceptions;
using SmartTask.Application.Features.ProjectMembers.DTOs;
using SmartTask.Application.Features.ProjectMembers.Services;
using SmartTask.Domain.Entities;

namespace SmartTask.Infrastructure.Services;

public class ProjectMemberService
    : IProjectMemberService
{
    private readonly IProjectRepository _projectRepository;

    private readonly IUserRepository _userRepository;

    private readonly IProjectMemberRepository
        _projectMemberRepository;

    public ProjectMemberService(
        IProjectRepository projectRepository,
        IUserRepository userRepository,
        IProjectMemberRepository projectMemberRepository)
    {
        _projectRepository = projectRepository;

        _userRepository = userRepository;

        _projectMemberRepository =
            projectMemberRepository;
    }

    public async Task AddMemberAsync(
        Guid projectId,
        Guid userId)
    {
        var project =
            await _projectRepository
                .GetByIdAsync(projectId);

        if (project is null)
            throw new NotFoundException(
                "Project not found.");

        var user =
            await _userRepository
                .GetByIdAsync(userId);

        if (user is null)
            throw new NotFoundException(
                "User not found.");

        var exists =
            await _projectMemberRepository
                .ExistsAsync(
                    projectId,
                    userId);

        if (exists)
            throw new BadRequestException(
                "User already assigned.");

        var member =
            new ProjectMember
            {
                Id = Guid.NewGuid(),

                ProjectId = projectId,

                UserId = userId,

                JoinedAt = DateTime.UtcNow,

                CreatedAt = DateTime.UtcNow,

                UpdatedAt = DateTime.UtcNow
            };

        await _projectMemberRepository
            .AddAsync(member);

        await _projectMemberRepository
            .SaveChangesAsync();
    }

    public async Task RemoveMemberAsync(
        Guid projectId,
        Guid userId)
    {
        var member =
            await _projectMemberRepository
                .GetAsync(
                    projectId,
                    userId);

        if (member is null)
            throw new NotFoundException(
                "Member not found.");

        await _projectMemberRepository
            .DeleteAsync(member);

        await _projectMemberRepository
            .SaveChangesAsync();
    }

    public async Task<List<ProjectMemberDto>>
        GetMembersAsync(Guid projectId)
    {
        var members =
            await _projectMemberRepository
                .GetMembersAsync(projectId);

        return members
            .Select(x =>
                new ProjectMemberDto
                {
                    UserId = x.UserId,

                    FullName =
                        $"{x.User.FirstName} {x.User.LastName}",

                    Email = x.User.Email,

                    JoinedAt = x.JoinedAt,

                    Role = x.User
                        .UserRoles
                        .FirstOrDefault()?
                        .Role
                        .Name ?? string.Empty
                })
            .ToList();
    }
}