using InventoryAPI.Models;

namespace InventoryAPI.Repositories.Interfaces;

public interface IAuditLogRepository
{
    Task<List<AuditLog>> GetAllAsync(int page, int pageSize);
    Task<int> CountAsync();
    Task CreateAsync(AuditLog log);
}
