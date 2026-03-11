using InventoryAPI.DTOs;

namespace InventoryAPI.Services.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryResponseDto>> GetAllAsync();
    Task<CategoryResponseDto> CreateAsync(CategoryCreateDto dto);
}
