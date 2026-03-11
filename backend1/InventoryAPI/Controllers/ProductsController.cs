using System.Security.Claims;
using InventoryAPI.DTOs;
using InventoryAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    /// <summary>List products with pagination and search</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null)
    {
        var result = await _productService.GetAllAsync(page, pageSize, search, categoryId);
        return Ok(ApiResponseDto<PagedResultDto<ProductResponseDto>>.Ok(result));
    }

    /// <summary>Get product by ID</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _productService.GetByIdAsync(id);

        if (product == null)
            return NotFound(ApiResponseDto<string>.Fail($"Product {id} not found"));

        return Ok(ApiResponseDto<ProductResponseDto>.Ok(product));
    }

    /// <summary>Create a new product</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<string>.Fail("Invalid data"));

        var userId  = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var product = await _productService.CreateAsync(dto, userId);

        return CreatedAtAction(nameof(GetById), new { id = product.Id },
            ApiResponseDto<ProductResponseDto>.Ok(product, "Product created successfully!"));
    }

    /// <summary>Update an existing product</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<string>.Fail("Invalid data"));

        var userId  = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var product = await _productService.UpdateAsync(id, dto, userId);

        if (product == null)
            return NotFound(ApiResponseDto<string>.Fail($"Product {id} not found"));

        return Ok(ApiResponseDto<ProductResponseDto>.Ok(product, "Product updated!"));
    }

    /// <summary>Export products to CSV</summary>
    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv()
    {
        var csvBytes = await _productService.ExportCsvAsync();
        return File(csvBytes, "text/csv", $"products_{DateTime.Now:yyyyMMdd}.csv");
    }

    /// <summary>Import products from CSV</summary>
    [HttpPost("import/csv")]
    public async Task<IActionResult> ImportCsv(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponseDto<string>.Fail("Invalid CSV file"));

        using var reader = new System.IO.StreamReader(file.OpenReadStream());
        var csvContent   = await reader.ReadToEndAsync();

        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (imported, errors) = await _productService.ImportCsvAsync(csvContent, userId);

        return Ok(ApiResponseDto<object>.Ok(new { imported, errors },
            $"{imported} product(s) imported successfully"));
    }

    /// <summary>Delete a product</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _productService.DeleteAsync(id);

        if (!deleted)
            return NotFound(ApiResponseDto<string>.Fail($"Product {id} not found"));

        return Ok(ApiResponseDto<string>.Ok("Product deleted", "Product deleted successfully!"));
    }
}
