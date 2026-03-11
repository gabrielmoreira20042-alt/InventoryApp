namespace InventoryAPI.Models;

/// <summary>
/// Regista todas as alterações feitas a produtos (quem fez, quando, o quê)
/// </summary>
public class AuditLog
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;       // "CREATE", "UPDATE", "DELETE"
    public string EntityName { get; set; } = "Product";
    public int EntityId { get; set; }
    public string EntityTitle { get; set; } = string.Empty;  // nome do produto
    public string? Changes { get; set; }                     // JSON com o que mudou
    public string PerformedBy { get; set; } = string.Empty;  // nome do utilizador
    public int UserId { get; set; }
    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;
}
