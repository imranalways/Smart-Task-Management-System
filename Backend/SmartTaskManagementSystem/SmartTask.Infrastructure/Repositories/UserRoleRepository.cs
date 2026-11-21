using Microsoft.EntityFrameworkCore;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Domain.Entities;
using SmartTask.Infrastructure.Persistence;

namespace SmartTask.Infrastructure.Repositories;

public class UserRoleRepository : IUserRoleRepository
{
    private readonly ApplicationDbContext _context;

    public UserRoleRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(UserRole userRole)
    {
        await _context.UserRoles.AddAsync(userRole);
    }

    public async Task<UserRole?> GetByUserIdAsync(Guid userId)
    {
        return await _context.UserRoles
            .Include(x => x.Role)
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.UserId == userId);
    }

    public async Task<IEnumerable<UserRole>> GetRolesByUserIdAsync(Guid userId)
    {
        return await _context.UserRoles
            .Include(x => x.Role)
            .Where(x => x.UserId == userId)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}