using SmartTask.Application.Features.ProjectMembers.DTOs;

namespace SmartTask.Application.Features.ProjectMembers.Services;

public interface IProjectMemberService
{
    Task AddMemberAsync(
        Guid projectId,
        Guid userId);

    Task RemoveMemberAsync(
        Guid projectId,
        Guid userId);

    Task<List<ProjectMemberDto>>
        GetMembersAsync(
            Guid projectId);
}