using Microsoft.EntityFrameworkCore;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Domain.Entities;
using SmartTask.Infrastructure.Persistence;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(User user)
    {
        await _context.Users.AddAsync(user);
    }

    public async Task<User?> GetByEmailAsync(
        string email)
    {
        return await _context.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(
                x => x.Email == email);
    }

    public async Task<User?> GetByIdAsync(
        Guid id)
    {
        return await _context.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(
                x => x.Id == id);
    }

    public async Task<bool> ExistsAsync(
        string email)
    {
        return await _context.Users
            .AnyAsync(x => x.Email == email);
    }

    public async Task UpdateAsync(User user)
    {
        _context.Users.Update(user);

        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}