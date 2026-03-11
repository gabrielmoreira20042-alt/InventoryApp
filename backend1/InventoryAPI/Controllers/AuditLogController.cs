using System.Security.Claims;
using System.Text;
using InventoryAPI.DTOs;
using InventoryAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditLogController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    /// <summary>Get paginated change history</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _auditLogService.GetAllAsync(page, pageSize);
        return Ok(ApiResponseDto<PagedResultDto<AuditLogResponseDto>>.Ok(result));
    }

    /// <summary>Export all products to CSV</summary>
    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv()
    {
        var csv      = await _auditLogService.ExportProductsCsvAsync();
        var bytes    = Encoding.UTF8.GetBytes(csv);
        var fileName = $"inventory_{DateTime.UtcNow:yyyyMMdd_HHmm}.csv";
        return File(bytes, "text/csv", fileName);
    }

    /// <summary>Import products from CSV</summary>
    [HttpPost("import-csv")]
    public async Task<IActionResult> ImportCsv([FromBody] CsvImportRequestDto request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _auditLogService.ImportProductsCsvAsync(request.CsvContent, userId);
        return Ok(ApiResponseDto<CsvImportResultDto>.Ok(result,
            $"{result.Imported} products imported, {result.Skipped} skipped"));
    }
}

public class CsvImportRequestDto
{
    public string CsvContent { get; set; } = string.Empty;
}
