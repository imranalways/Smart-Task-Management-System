using SmartTask.Domain.Entities;

namespace SmartTask.Application.Contracts.Persistence;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);

    Task<User?> GetByEmailAsync(string email);
    Task<List<User>> GetAllAsync();
    Task<bool> ExistsAsync(string email);

    Task AddAsync(User user);

    Task UpdateAsync(User user);

    Task SaveChangesAsync();
}
