using InventoryAPI.Models;

namespace InventoryAPI.Repositories.Interfaces;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync(int page, int pageSize, string? search, int? categoryId);
    Task<int> CountAsync(string? search, int? categoryId);
    Task<Product?> GetByIdAsync(int id);
    Task<Product?> GetBySKUAsync(string sku);
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(Product product);
    Task<bool> DeleteAsync(int id);
}
