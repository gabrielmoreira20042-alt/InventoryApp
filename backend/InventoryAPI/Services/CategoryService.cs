using InventoryAPI.DTOs;
using InventoryAPI.Models;
using InventoryAPI.Repositories.Interfaces;
using InventoryAPI.Services.Interfaces;

namespace InventoryAPI.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<List<CategoryResponseDto>> GetAllAsync()
    {
        var categories = await _categoryRepository.GetAllAsync();
        return categories.Select(c => new CategoryResponseDto
        {
            Id           = c.Id,
            Name         = c.Name,
            Description  = c.Description,
            ProductCount = c.Products.Count
        }).ToList();
    }

    public async Task<CategoryResponseDto> CreateAsync(CategoryCreateDto dto)
    {
        var category = new Category
        {
            Name        = dto.Name,
            Description = dto.Description
        };

        var created = await _categoryRepository.CreateAsync(category);
        return new CategoryResponseDto
        {
            Id           = created.Id,
            Name         = created.Name,
            Description  = created.Description,
            ProductCount = 0
        };
    }
}
