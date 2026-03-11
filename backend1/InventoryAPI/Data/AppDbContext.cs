using InventoryAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace InventoryAPI.Data;

/// <summary>
/// Database context — Entity Framework uses this to know which
/// tables exist and how to configure them.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Each DbSet<T> maps to a table in the database
    public DbSet<User>     Users      { get; set; }
    public DbSet<Product>  Products   { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<AuditLog> AuditLogs  { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User table configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique(); // unique email
            entity.Property(u => u.Name).HasMaxLength(100).IsRequired();
            entity.Property(u => u.Email).HasMaxLength(200).IsRequired();
        });

        // Product table configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(p => p.SKU).IsUnique(); // unique SKU
            entity.Property(p => p.Price).HasColumnType("decimal(18,2)");
            entity.Property(p => p.Name).HasMaxLength(200).IsRequired();

            // Relationship: Product belongs to Category
            entity.HasOne(p => p.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Relationship: Product was created by a User
            entity.HasOne(p => p.User)
                  .WithMany(u => u.Products)
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Category table configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(c => c.Name).HasMaxLength(100).IsRequired();
        });
    }
}

/// <summary>
/// Seeds initial data into the database on first run.
/// </summary>
public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        // Only seed if the table is empty
        if (context.Categories.Any()) return;

        // Create initial categories
        var categories = new List<Category>
        {
            new() { Name = "Electronics",  Description = "Phones, tablets, computers" },
            new() { Name = "Clothing",     Description = "Apparel and accessories" },
            new() { Name = "Food",         Description = "Food and grocery products" },
            new() { Name = "Tools",        Description = "Tools and equipment" }
        };
        context.Categories.AddRange(categories);
        context.SaveChanges();

        // Create default admin user
        if (!context.Users.Any())
        {
            var admin = new User
            {
                Name         = "Administrator",
                Email        = "admin@inventory.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Role         = "Admin"
            };
            context.Users.Add(admin);
            context.SaveChanges();

            // Create sample products
            var products = new List<Product>
            {
                new() { Name = "iPhone 15",      Description = "Apple smartphone",          Price = 999.99m,  Quantity = 50,  SKU = "APPL-001", CategoryId = categories[0].Id, UserId = admin.Id },
                new() { Name = "MacBook Pro",    Description = "Apple M3 laptop",           Price = 2499.99m, Quantity = 20,  SKU = "APPL-002", CategoryId = categories[0].Id, UserId = admin.Id },
                new() { Name = "Premium T-Shirt",Description = "100% cotton t-shirt",       Price = 29.99m,   Quantity = 200, SKU = "CLTH-001", CategoryId = categories[1].Id, UserId = admin.Id },
                new() { Name = "Claw Hammer",    Description = "Carpenter's claw hammer",   Price = 15.50m,   Quantity = 100, SKU = "TOOL-001", CategoryId = categories[3].Id, UserId = admin.Id }
            };
            context.Products.AddRange(products);
            context.SaveChanges();
        }
    }
}
