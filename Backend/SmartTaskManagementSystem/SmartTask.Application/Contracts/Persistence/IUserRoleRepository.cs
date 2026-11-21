using SmartTask.Domain.Entities;

namespace SmartTask.Application.Contracts.Persistence;

public interface IUserRoleRepository
{
    Task AddAsync(UserRole userRole);

    Task<UserRole?> GetByUserIdAsync(Guid userId);

    Task<IEnumerable<UserRole>> GetRolesByUserIdAsync(Guid userId);

    Task SaveChangesAsync();
}