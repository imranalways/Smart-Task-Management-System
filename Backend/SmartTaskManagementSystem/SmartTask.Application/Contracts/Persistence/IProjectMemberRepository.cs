using SmartTask.Domain.Entities;

namespace SmartTask.Application.Contracts.Persistence;

public interface IProjectMemberRepository
{
    Task AddAsync(ProjectMember projectMember);

    Task DeleteAsync(ProjectMember projectMember);

    Task<ProjectMember?> GetAsync(
        Guid projectId,
        Guid userId);

    Task<bool> ExistsAsync(
        Guid projectId,
        Guid userId);

    Task<List<ProjectMember>> GetMembersAsync(
        Guid projectId);

    Task SaveChangesAsync();
}