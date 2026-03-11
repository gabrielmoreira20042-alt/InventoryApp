using InventoryAPI.Data;
using InventoryAPI.Models;
using InventoryAPI.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryAPI.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AppDbContext _context;

    public AuditLogRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AuditLog>> GetAllAsync(int page, int pageSize) =>
        await _context.AuditLogs
            .OrderByDescending(a => a.PerformedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

    public async Task<int> CountAsync() =>
        await _context.AuditLogs.CountAsync();

    public async Task CreateAsync(AuditLog log)
    {
        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
