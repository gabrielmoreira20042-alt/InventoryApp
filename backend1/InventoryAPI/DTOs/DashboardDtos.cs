namespace InventoryAPI.DTOs;

public class DashboardStatsDto
{
    public int TotalProducts { get; set; }
    public int ActiveProducts { get; set; }
    public int LowStockCount { get; set; }       // stock < 10
    public int OutOfStockCount { get; set; }      // stock = 0
    public decimal TotalInventoryValue { get; set; }
    public int TotalCategories { get; set; }
    public List<CategoryStockDto> StockByCategory { get; set; } = new();
    public List<LowStockProductDto> LowStockProducts { get; set; } = new();
    public List<TopProductDto> TopValueProducts { get; set; } = new();
    public List<MonthlyActivityDto> RecentActivity { get; set; } = new();
}

public class CategoryStockDto
{
    public string CategoryName { get; set; } = string.Empty;
    public int ProductCount { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalValue { get; set; }
}

public class LowStockProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string CategoryName { get; set; } = string.Empty;
}

public class TopProductDto
{
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal TotalValue { get; set; }
}

public class MonthlyActivityDto
{
    public string Month { get; set; } = string.Empty;
    public int ProductsAdded { get; set; }
}
