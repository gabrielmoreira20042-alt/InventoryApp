using System.Text;
using InventoryAPI.Data;
using InventoryAPI.DTOs;
using InventoryAPI.Models;
using InventoryAPI.Repositories.Interfaces;
using InventoryAPI.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryAPI.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly AppDbContext _context;

    public AuditLogService(IAuditLogRepository auditLogRepository, AppDbContext context)
    {
        _auditLogRepository = auditLogRepository;
        _context = context;
    }

    public async Task<PagedResultDto<AuditLogResponseDto>> GetAllAsync(int page, int pageSize)
    {
        var logs  = await _auditLogRepository.GetAllAsync(page, pageSize);
        var total = await _auditLogRepository.CountAsync();

        return new PagedResultDto<AuditLogResponseDto>
        {
            Items = logs.Select(l => new AuditLogResponseDto
            {
                Id          = l.Id,
                Action      = l.Action,
                EntityTitle = l.EntityTitle,
                EntityId    = l.EntityId,
                Changes     = l.Changes,
                PerformedBy = l.PerformedBy,
                PerformedAt = l.PerformedAt
            }).ToList(),
            TotalItems = total,
            Page       = page,
            PageSize   = pageSize
        };
    }

    public async Task LogAsync(string action, int entityId, string entityTitle,
        int userId, string performedBy, string? changes = null)
    {
        await _auditLogRepository.CreateAsync(new AuditLog
        {
            Action      = action,
            EntityId    = entityId,
            EntityTitle = entityTitle,
            UserId      = userId,
            PerformedBy = performedBy,
            Changes     = changes
        });
    }

    public async Task<string> ExportProductsCsvAsync()
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .OrderBy(p => p.Name)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Name,SKU,Description,Price,Quantity,Category,IsActive");

        foreach (var p in products)
        {
            // Escape commas and quotes in text fields
            var name = $"\"{p.Name.Replace("\"", "\"\"")}\"";
            var desc = $"\"{p.Description.Replace("\"", "\"\"")}\"";
            var cat  = $"\"{(p.Category?.Name ?? "").Replace("\"", "\"\"")}\"";
            sb.AppendLine($"{name},{p.SKU},{desc},{p.Price},{p.Quantity},{cat},{p.IsActive}");
        }

        return sb.ToString();
    }

    public async Task<CsvImportResultDto> ImportProductsCsvAsync(string csvContent, int userId)
    {
        var result = new CsvImportResultDto();
        var lines  = csvContent.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        // Skip header row
        for (int i = 1; i < lines.Length; i++)
        {
            try
            {
                var cols = ParseCsvLine(lines[i].Trim());
                if (cols.Length < 5)
                {
                    result.Errors.Add($"Row {i + 1}: insufficient columns");
                    result.Skipped++;
                    continue;
                }

                var sku = cols[1].Trim();

                // Skip if SKU already exists
                if (await _context.Products.AnyAsync(p => p.SKU == sku))
                {
                    result.Errors.Add($"Row {i + 1}: SKU '{sku}' already exists");
                    result.Skipped++;
                    continue;
                }

                // Find category by name, or fall back to the first available
                var categoryName = cols.Length > 5 ? cols[5].Trim() : "";
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Name.ToLower() == categoryName.ToLower())
                    ?? await _context.Categories.FirstOrDefaultAsync();

                if (category == null)
                {
                    result.Errors.Add($"Row {i + 1}: category not found");
                    result.Skipped++;
                    continue;
                }

                var product = new Product
                {
                    Name        = cols[0].Trim(),
                    SKU         = sku,
                    Description = cols.Length > 2 ? cols[2].Trim() : "",
                    Price       = decimal.TryParse(cols[3].Trim(), out var price) ? price : 0,
                    Quantity    = int.TryParse(cols[4].Trim(), out var qty) ? qty : 0,
                    CategoryId  = category.Id,
                    UserId      = userId
                };

                _context.Products.Add(product);
                result.Imported++;
            }
            catch (Exception ex)
            {
                result.Errors.Add($"Row {i + 1}: {ex.Message}");
                result.Skipped++;
            }
        }

        if (result.Imported > 0)
            await _context.SaveChangesAsync();

        return result;
    }

    // Simple CSV parser that respects quoted fields
    private static string[] ParseCsvLine(string line)
    {
        var result   = new List<string>();
        var current  = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                { current.Append('"'); i++; }
                else inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            { result.Add(current.ToString()); current.Clear(); }
            else current.Append(c);
        }
        result.Add(current.ToString());
        return result.ToArray();
    }
}
