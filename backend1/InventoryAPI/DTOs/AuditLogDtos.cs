namespace InventoryAPI.DTOs;

public class AuditLogResponseDto
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityTitle { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string? Changes { get; set; }
    public string PerformedBy { get; set; } = string.Empty;
    public DateTime PerformedAt { get; set; }
    public string ActionColor => Action switch
    {
        "CREATE" => "success",
        "UPDATE" => "warning",
        "DELETE" => "danger",
        _ => "info"
    };
}

public class CsvImportResultDto
{
    public int Imported { get; set; }
    public int Skipped { get; set; }
    public List<string> Errors { get; set; } = new();
}
