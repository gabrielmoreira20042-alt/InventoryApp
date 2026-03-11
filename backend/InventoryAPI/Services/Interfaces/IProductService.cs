using InventoryAPI.DTOs;

namespace InventoryAPI.Services.Interfaces;

public interface IProductService
{
    Task<PagedResultDto<ProductResponseDto>> GetAllAsync(int page, int pageSize, string? search, int? categoryId);
    Task<ProductResponseDto?> GetByIdAsync(int id);
    Task<ProductResponseDto> CreateAsync(ProductCreateDto dto, int userId);
    Task<ProductResponseDto?> UpdateAsync(int id, ProductUpdateDto dto, int userId);
    Task<bool> DeleteAsync(int id);
    Task<byte[]> ExportCsvAsync();
    Task<(int imported, List<string> errors)> ImportCsvAsync(string csvContent, int userId);
}
