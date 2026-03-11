using System.Text;
using InventoryAPI.Data;
using InventoryAPI.Repositories;
using InventoryAPI.Repositories.Interfaces;
using InventoryAPI.Services;
using InventoryAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// PORT — Render injects $PORT at runtime
// ==========================================
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// ==========================================
// DATABASE — Entity Framework + SQLite
// ==========================================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// ==========================================
// DEPENDENCY INJECTION
// ==========================================
builder.Services.AddScoped<IUserRepository,     UserRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IProductRepository,  ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IAuthService,        AuthService>();
builder.Services.AddScoped<IAuditLogService,    AuditLogService>();
builder.Services.AddScoped<IProductService,     ProductService>();
builder.Services.AddScoped<IDashboardService,   DashboardService>();
builder.Services.AddScoped<ICategoryService,    CategoryService>();

// ==========================================
// JWT — lê de env vars em produção:
//   JWT__Key, JWT__Issuer, JWT__Audience
// ==========================================
var jwtKey     = Environment.GetEnvironmentVariable("JWT__Key")      ?? builder.Configuration["Jwt:Key"]!;
var jwtIssuer  = Environment.GetEnvironmentVariable("JWT__Issuer")   ?? builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = Environment.GetEnvironmentVariable("JWT__Audience") ?? builder.Configuration["Jwt:Audience"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtIssuer,
            ValidAudience            = jwtAudience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ==========================================
// CORS — define ALLOWED_ORIGINS no Render
//   ex: https://myapp.onrender.com,https://myapp.vercel.app
// ==========================================
var allowedOrigins = (Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") ?? "http://localhost:4200")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ==========================================
// CONTROLLERS + SWAGGER
// ==========================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "Inventory API",
        Version     = "v1",
        Description = "Inventory Management REST API with JWT Authentication"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization. Example: Bearer {token}",
        Name        = "Authorization",
        In          = ParameterLocation.Header,
        Type        = SecuritySchemeType.ApiKey,
        Scheme      = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ==========================================
// MIDDLEWARE PIPELINE
// Swagger disponível em todos os ambientes
// ==========================================
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Inventory API v1");
    c.RoutePrefix = "swagger";
});

// Render termina SSL externamente — HTTPS redirect removido
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Redireciona / para Swagger
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

// ==========================================
// CRIAR BASE DE DADOS E SEED
// ==========================================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    DbSeeder.Seed(db);
}

app.Run();
