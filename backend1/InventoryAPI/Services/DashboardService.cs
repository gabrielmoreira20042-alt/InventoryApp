using InventoryAPI.Data;
using InventoryAPI.DTOs;
using InventoryAPI.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryAPI.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetStatsAsync()
    {
        var products   = await _context.Products.Include(p => p.Category).ToListAsync();
        var categories = await _context.Categories.Include(c => c.Products).ToListAsync();

        const int lowStockThreshold = 10;

        // Stock breakdown by category
        var stockByCategory = categories.Select(c => new CategoryStockDto
        {
            CategoryName  = c.Name,
            ProductCount  = c.Products.Count,
            TotalQuantity = c.Products.Sum(p => p.Quantity),
            TotalValue    = c.Products.Sum(p => p.Price * p.Quantity)
        }).ToList();

        // Products with low stock
        var lowStockProducts = products
            .Where(p => p.Quantity > 0 && p.Quantity < lowStockThreshold)
            .OrderBy(p => p.Quantity)
            .Take(10)
            .Select(p => new LowStockProductDto
            {
                Id           = p.Id,
                Name         = p.Name,
                SKU          = p.SKU,
                Quantity     = p.Quantity,
                CategoryName = p.Category?.Name ?? ""
            }).ToList();

        // Top products by total stock value
        var topValueProducts = products
            .OrderByDescending(p => p.Price * p.Quantity)
            .Take(5)
            .Select(p => new TopProductDto
            {
                Name       = p.Name,
                SKU        = p.SKU,
                Price      = p.Price,
                Quantity   = p.Quantity,
                TotalValue = p.Price * p.Quantity
            }).ToList();

        // Activity over the last 6 months
        var sixMonthsAgo   = DateTime.UtcNow.AddMonths(-6);
        var recentActivity = products
            .Where(p => p.CreatedAt >= sixMonthsAgo)
            .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new MonthlyActivityDto
            {
                Month         = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yy"),
                ProductsAdded = g.Count()
            }).ToList();

        return new DashboardStatsDto
        {
            TotalProducts       = products.Count,
            ActiveProducts      = products.Count(p => p.IsActive),
            LowStockCount       = products.Count(p => p.Quantity > 0 && p.Quantity < lowStockThreshold),
            OutOfStockCount     = products.Count(p => p.Quantity == 0),
            TotalInventoryValue = products.Sum(p => p.Price * p.Quantity),
            TotalCategories     = categories.Count,
            StockByCategory     = stockByCategory,
            LowStockProducts    = lowStockProducts,
            TopValueProducts    = topValueProducts,
            RecentActivity      = recentActivity
        };
    }
}
