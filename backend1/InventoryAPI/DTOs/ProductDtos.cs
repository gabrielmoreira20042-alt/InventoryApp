using System.ComponentModel.DataAnnotations;

namespace InventoryAPI.DTOs;

public class ProductCreateDto
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than zero")]
    public decimal Price { get; set; }

    [Required]
    [Range(0, int.MaxValue, ErrorMessage = "Quantity cannot be negative")]
    public int Quantity { get; set; }

    [Required]
    public string SKU { get; set; } = string.Empty;

    [Required]
    public int CategoryId { get; set; }
}

public class ProductUpdateDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int Quantity { get; set; }

    public string SKU { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    [Required]
    public int CategoryId { get; set; }
}

public class ProductResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public string SKU { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
