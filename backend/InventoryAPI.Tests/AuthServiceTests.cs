using FluentAssertions;
using InventoryAPI.DTOs;
using InventoryAPI.Models;
using InventoryAPI.Repositories.Interfaces;
using InventoryAPI.Services;
using InventoryAPI.Services.Interfaces;
using Moq;

namespace InventoryAPI.Tests;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepoMock;
    private readonly Mock<IConfiguration>  _configMock;
    private readonly IAuthService          _authService;

    public AuthServiceTests()
    {
        _userRepoMock = new Mock<IUserRepository>();
        _configMock   = new Mock<IConfiguration>();

        _configMock.Setup(c => c["Jwt:Key"]).Returns("TestSecretKey_MustBe32CharactersLong!");
        _configMock.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
        _configMock.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");
        _configMock.Setup(c => c["Jwt:ExpiryInHours"]).Returns("8");

        _authService = new AuthService(_userRepoMock.Object, _configMock.Object);
    }

    [Fact]
    public async Task RegisterAsync_NewEmail_ReturnsTokenWithCorrectEmail()
    {
        // Arrange
        var dto = new RegisterDto { Name = "John Smith", Email = "john@test.com", Password = "Test123!" };

        _userRepoMock.Setup(r => r.ExistsAsync(dto.Email)).ReturnsAsync(false);
        _userRepoMock.Setup(r => r.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync(new User { Id = 1, Name = dto.Name, Email = dto.Email, Role = "User" });

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result!.Token.Should().NotBeEmpty();
        result.Email.Should().Be(dto.Email);
        result.Name.Should().Be(dto.Name);
    }

    [Fact]
    public async Task RegisterAsync_ExistingEmail_ReturnsNull()
    {
        // Arrange
        var dto = new RegisterDto { Email = "existing@test.com", Name = "Test", Password = "Test123!" };
        _userRepoMock.Setup(r => r.ExistsAsync(dto.Email)).ReturnsAsync(true);

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        result.Should().BeNull();
        _userRepoMock.Verify(r => r.CreateAsync(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_CorrectCredentials_ReturnsToken()
    {
        // Arrange
        var password = "CorrectPassword";
        var user = new User
        {
            Id           = 1,
            Name         = "Test User",
            Email        = "test@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role         = "User"
        };
        _userRepoMock.Setup(r => r.GetByEmailAsync("test@test.com")).ReturnsAsync(user);

        var dto = new LoginDto { Email = "test@test.com", Password = password };

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result!.Token.Should().NotBeEmpty();
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ReturnsNull()
    {
        // Arrange
        var user = new User
        {
            Email        = "test@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword"),
            Role         = "User"
        };
        _userRepoMock.Setup(r => r.GetByEmailAsync("test@test.com")).ReturnsAsync(user);

        var dto = new LoginDto { Email = "test@test.com", Password = "WrongPassword" };

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_NonExistingUser_ReturnsNull()
    {
        // Arrange
        _userRepoMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        var dto = new LoginDto { Email = "ghost@test.com", Password = "whatever" };

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        result.Should().BeNull();
    }
}
