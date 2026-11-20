using SmartTask.Domain.Entities;

namespace SmartTask.Application.Contracts.Persistence;

public interface IRefreshTokenRepository
{
    Task AddAsync(RefreshToken token);

    Task<RefreshToken?> GetByTokenAsync(
        string token);

    Task UpdateAsync(RefreshToken token);

    Task SaveChangesAsync();
}