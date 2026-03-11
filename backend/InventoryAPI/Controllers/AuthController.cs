using System.Security.Claims;
using InventoryAPI.DTOs;
using InventoryAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>Register a new user</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<string>.Fail("Invalid data"));

        var result = await _authService.RegisterAsync(dto);

        if (result == null)
            return Conflict(ApiResponseDto<string>.Fail("Email already registered"));

        return Ok(ApiResponseDto<AuthResponseDto>.Ok(result, "Registration successful!"));
    }

    /// <summary>Login — returns JWT token</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponseDto<string>.Fail("Invalid data"));

        var result = await _authService.LoginAsync(dto);

        if (result == null)
            return Unauthorized(ApiResponseDto<string>.Fail("Invalid email or password"));

        return Ok(ApiResponseDto<AuthResponseDto>.Ok(result, "Login successful!"));
    }

    /// <summary>Get authenticated user info</summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetMe()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email  = User.FindFirst(ClaimTypes.Email)?.Value;
        var name   = User.FindFirst(ClaimTypes.Name)?.Value;
        var role   = User.FindFirst(ClaimTypes.Role)?.Value;

        return Ok(ApiResponseDto<object>.Ok(new { userId, email, name, role }));
    }
}
