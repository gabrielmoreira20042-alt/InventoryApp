using InventoryAPI.DTOs;

namespace InventoryAPI.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();
}

public interface IAuditLogService
{
    Task<PagedResultDto<AuditLogResponseDto>> GetAllAsync(int page, int pageSize);
    Task LogAsync(string action, int entityId, string entityTitle, int userId, string performedBy, string? changes = null);
    Task<string> ExportProductsCsvAsync();
    Task<CsvImportResultDto> ImportProductsCsvAsync(string csvContent, int userId);
}
