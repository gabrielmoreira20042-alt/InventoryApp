using InventoryAPI.DTOs;
using InventoryAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    /// <summary>List all categories</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _categoryService.GetAllAsync();
        return Ok(ApiResponseDto<List<CategoryResponseDto>>.Ok(categories));
    }

    /// <summary>Create a new category — Admin only</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CategoryCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<string>.Fail("Invalid data"));

        var category = await _categoryService.CreateAsync(dto);
        return Ok(ApiResponseDto<CategoryResponseDto>.Ok(category, "Category created!"));
    }
}
