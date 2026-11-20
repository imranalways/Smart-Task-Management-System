using Microsoft.EntityFrameworkCore;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Domain.Entities;

public class RefreshTokenRepository
    : IRefreshTokenRepository
{
    private readonly ApplicationDbContext
        _context;

    public RefreshTokenRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(
        RefreshToken token)
    {
        await _context.RefreshTokens
            .AddAsync(token);
    }

    public async Task<RefreshToken?>
        GetByTokenAsync(
            string token)
    {
        return await _context.RefreshTokens
            .Include(x => x.User)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(
                x => x.Token == token);
    }

    public async Task UpdateAsync(
        RefreshToken token)
    {
        _context.RefreshTokens.Update(token);

        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}