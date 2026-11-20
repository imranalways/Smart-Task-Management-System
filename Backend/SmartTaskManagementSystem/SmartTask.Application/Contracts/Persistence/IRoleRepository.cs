using SmartTask.Domain.Entities;

namespace SmartTask.Application.Contracts.Persistence;

public interface IRoleRepository
{
    Task<Role?> GetByIdAsync(Guid id);

    Task<Role?> GetByNameAsync(string name);
}