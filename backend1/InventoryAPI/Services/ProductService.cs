using InventoryAPI.DTOs;
using InventoryAPI.Models;
using InventoryAPI.Repositories.Interfaces;
using InventoryAPI.Services.Interfaces;

namespace InventoryAPI.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository = null!;
    private readonly ICategoryRepository _categoryRepository = null!;
    private readonly IAuditLogService _auditLogService = null!;

    public ProductService(
        IProductRepository productRepository,
        ICategoryRepository categoryRepository,
        IAuditLogService auditLogService)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResultDto<ProductResponseDto>> GetAllAsync(int page, int pageSize, string? search, int? categoryId)
    {
        var products = await _productRepository.GetAllAsync(page, pageSize, search, categoryId);
        var total    = await _productRepository.CountAsync(search, categoryId);
        return new PagedResultDto<ProductResponseDto>
        {
            Items     = products.Select(MapToDto).ToList(),
            TotalItems = total,
            Page      = page,
            PageSize  = pageSize
        };
    }

    public async Task<ProductResponseDto?> GetByIdAsync(int id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        return product == null ? null : MapToDto(product);
    }

    public async Task<ProductResponseDto> CreateAsync(ProductCreateDto dto, int userId)
    {
        var product = new Product
        {
            Name        = dto.Name,
            Description = dto.Description,
            Price       = dto.Price,
            Quantity    = dto.Quantity,
            SKU         = dto.SKU,
            CategoryId  = dto.CategoryId,
            UserId      = userId
        };

        var created = await _productRepository.CreateAsync(product);
        await _auditLogService.LogAsync("CREATE", created.Id, created.Name, userId, "User",
            $"Price: ${dto.Price:F2}, Qty: {dto.Quantity}, SKU: {dto.SKU}");

        var withRelations = await _productRepository.GetByIdAsync(created.Id);
        return MapToDto(withRelations!);
    }

    public async Task<ProductResponseDto?> UpdateAsync(int id, ProductUpdateDto dto, int userId)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null) return null;

        // Track what changed for the audit log
        var changes = new List<string>();
        if (product.Name     != dto.Name)     changes.Add($"Name: '{product.Name}' → '{dto.Name}'");
        if (product.Price    != dto.Price)     changes.Add($"Price: ${product.Price:F2} → ${dto.Price:F2}");
        if (product.Quantity != dto.Quantity)  changes.Add($"Stock: {product.Quantity} → {dto.Quantity}");
        if (product.IsActive != dto.IsActive)  changes.Add($"Status: {(product.IsActive ? "Active" : "Inactive")} → {(dto.IsActive ? "Active" : "Inactive")}");

        product.Name        = dto.Name;
        product.Description = dto.Description;
        product.Price       = dto.Price;
        product.Quantity    = dto.Quantity;
        product.SKU         = dto.SKU;
        product.IsActive    = dto.IsActive;
        product.CategoryId  = dto.CategoryId;

        await _productRepository.UpdateAsync(product);

        if (changes.Count > 0)
            await _auditLogService.LogAsync("UPDATE", id, dto.Name, userId, "User", string.Join("; ", changes));

        var updated = await _productRepository.GetByIdAsync(id);
        return MapToDto(updated!);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null) return false;

        var name    = product.Name;
        var userId  = product.UserId;
        var deleted = await _productRepository.DeleteAsync(id);

        if (deleted)
            await _auditLogService.LogAsync("DELETE", id, name, userId, "User");

        return deleted;
    }

    public async Task<byte[]> ExportCsvAsync()
    {
        var products = await _productRepository.GetAllAsync(1, int.MaxValue, null, null);
        var sb       = new System.Text.StringBuilder();

        // Header row
        sb.AppendLine("Name,Description,Price,Quantity,SKU,CategoryName,IsActive");

        foreach (var p in products)
        {
            // Escape fields that may contain commas or quotes
            sb.AppendLine(
                $"\"{p.Name.Replace("\"", "\"\"")}\",\"{p.Description.Replace("\"", "\"\"")}\",{p.Price},{p.Quantity},\"{p.SKU}\",\"{p.Category?.Name ?? ""}\",{p.IsActive}");
        }

        return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<(int imported, List<string> errors)> ImportCsvAsync(string csvContent, int userId)
    {
        var errors     = new List<string>();
        var imported   = 0;
        var categories = await _categoryRepository.GetAllAsync();
        var lines      = csvContent.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        // Skip header row
        for (int i = 1; i < lines.Length; i++)
        {
            var line = lines[i].Trim();
            if (string.IsNullOrEmpty(line)) continue;

            try
            {
                var fields = ParseCsvLine(line);
                if (fields.Length < 5)
                {
                    errors.Add($"Row {i + 1}: insufficient columns");
                    continue;
                }

                var categoryName = fields.Length > 5 ? fields[5] : "General";
                var category     = categories.FirstOrDefault(c =>
                    c.Name.Equals(categoryName, StringComparison.OrdinalIgnoreCase));

                if (category == null)
                {
                    errors.Add($"Row {i + 1}: category '{categoryName}' not found");
                    continue;
                }

                if (!decimal.TryParse(fields[2], System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture, out var price))
                {
                    errors.Add($"Row {i + 1}: invalid price '{fields[2]}'");
                    continue;
                }

                if (!int.TryParse(fields[3], out var qty))
                {
                    errors.Add($"Row {i + 1}: invalid quantity '{fields[3]}'");
                    continue;
                }

                var product = new Product
                {
                    Name        = fields[0],
                    Description = fields.Length > 1 ? fields[1] : "",
                    Price       = price,
                    Quantity    = qty,
                    SKU         = fields[4],
                    CategoryId  = category.Id,
                    UserId      = userId
                };

                await _productRepository.CreateAsync(product);
                await _auditLogService.LogAsync("CREATE", product.Id, product.Name, userId, "User", "Imported via CSV");
                imported++;
            }
            catch (Exception ex)
            {
                errors.Add($"Row {i + 1}: error — {ex.Message}");
            }
        }

        return (imported, errors);
    }

    // Simple CSV parser that respects quoted fields
    private static string[] ParseCsvLine(string line)
    {
        var result   = new List<string>();
        var current  = new System.Text.StringBuilder();
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

    private static ProductResponseDto MapToDto(Product p) => new()
    {
        Id           = p.Id,
        Name         = p.Name,
        Description  = p.Description,
        Price        = p.Price,
        Quantity     = p.Quantity,
        SKU          = p.SKU,
        IsActive     = p.IsActive,
        CategoryId   = p.CategoryId,
        CategoryName = p.Category?.Name ?? "",
        CreatedBy    = p.User?.Name ?? "",
        CreatedAt    = p.CreatedAt,
        UpdatedAt    = p.UpdatedAt
    };
}
