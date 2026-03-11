using FluentAssertions;
using InventoryAPI.DTOs;
using InventoryAPI.Models;
using InventoryAPI.Repositories.Interfaces;
using InventoryAPI.Services;
using InventoryAPI.Services.Interfaces;
using Moq;

namespace InventoryAPI.Tests;

public class ProductServiceTests
{
    private readonly Mock<IProductRepository> _productRepoMock;
    private readonly Mock<ICategoryRepository> _categoryRepoMock;
    private readonly Mock<IAuditLogService> _auditLogMock;
    private readonly IProductService _productService;

    public ProductServiceTests()
    {
        _productRepoMock  = new Mock<IProductRepository>();
        _categoryRepoMock = new Mock<ICategoryRepository>();
        _auditLogMock     = new Mock<IAuditLogService>();

        // Configure audit log mock to do nothing — not relevant for these unit tests
        _auditLogMock
            .Setup(a => a.LogAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>(),
                                   It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        _productService = new ProductService(
            _productRepoMock.Object,
            _categoryRepoMock.Object,
            _auditLogMock.Object);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingProduct_ReturnsProduct()
    {
        // Arrange
        var product = CreateFakeProduct(id: 1, name: "Laptop");
        _productRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(product);

        // Act
        var result = await _productService.GetByIdAsync(1);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(1);
        result.Name.Should().Be("Laptop");
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingProduct_ReturnsNull()
    {
        // Arrange
        _productRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Product?)null);

        // Act
        var result = await _productService.GetByIdAsync(99);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_ValidProduct_CallsRepositoryOnce()
    {
        // Arrange
        var dto = new ProductCreateDto
        {
            Name = "iPhone 15", Price = 999.99m, Quantity = 10,
            SKU = "APPL-001", CategoryId = 1, Description = "Smartphone"
        };
        var fakeProduct = CreateFakeProduct(id: 1, name: dto.Name);

        _productRepoMock.Setup(r => r.CreateAsync(It.IsAny<Product>())).ReturnsAsync(fakeProduct);
        _productRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(fakeProduct);

        // Act
        var result = await _productService.CreateAsync(dto, userId: 1);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("iPhone 15");
        _productRepoMock.Verify(r => r.CreateAsync(It.IsAny<Product>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_SetsCorrectUserId()
    {
        // Arrange
        var dto = new ProductCreateDto { Name = "Test", Price = 10m, Quantity = 1, SKU = "TST-001", CategoryId = 1 };
        Product? captured   = null;
        var fakeProduct     = CreateFakeProduct(id: 1, name: "Test");

        _productRepoMock.Setup(r => r.CreateAsync(It.IsAny<Product>()))
            .Callback<Product>(p => captured = p)
            .ReturnsAsync(fakeProduct);
        _productRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(fakeProduct);

        // Act
        await _productService.CreateAsync(dto, userId: 42);

        // Assert
        captured!.UserId.Should().Be(42);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingProduct_ReturnsNull()
    {
        // Arrange
        _productRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Product?)null);

        // Act
        var result = await _productService.UpdateAsync(99, new ProductUpdateDto(), userId: 1);

        // Assert
        result.Should().BeNull();
        _productRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Product>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ExistingProduct_ReturnsTrue()
    {
        _productRepoMock.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);
        var result = await _productService.DeleteAsync(1);
        result.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAsync_NonExistingProduct_ReturnsFalse()
    {
        _productRepoMock.Setup(r => r.DeleteAsync(99)).ReturnsAsync(false);
        var result = await _productService.DeleteAsync(99);
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetAllAsync_ReturnsPagedResults()
    {
        // Arrange
        var products = new List<Product>
        {
            CreateFakeProduct(1, "Product A"),
            CreateFakeProduct(2, "Product B"),
            CreateFakeProduct(3, "Product C")
        };
        _productRepoMock.Setup(r => r.GetAllAsync(1, 10, null, null)).ReturnsAsync(products);
        _productRepoMock.Setup(r => r.CountAsync(null, null)).ReturnsAsync(3);

        // Act
        var result = await _productService.GetAllAsync(1, 10, null, null);

        // Assert
        result.Items.Should().HaveCount(3);
        result.TotalItems.Should().Be(3);
        result.TotalPages.Should().Be(1);
    }

    private static Product CreateFakeProduct(int id, string name) => new()
    {
        Id         = id,
        Name       = name,
        Description = "Test product",
        Price      = 99.99m,
        Quantity   = 10,
        SKU        = $"SKU-{id:000}",
        IsActive   = true,
        CategoryId = 1,
        UserId     = 1,
        Category   = new Category { Id = 1, Name = "Test Category" },
        User       = new User    { Id = 1, Name = "Admin" }
    };
}
