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
// PORT
// ==========================================
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// ==========================================
// DATABASE
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
// JWT
// ==========================================
var jwtKey      = Environment.GetEnvironmentVariable("JWT__Key")       ?? builder.Configuration["Jwt:Key"]!;
var jwtIssuer   = Environment.GetEnvironmentVariable("JWT__Issuer")    ?? builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = Environment.GetEnvironmentVariable("JWT__Audience")  ?? builder.Configuration["Jwt:Audience"]!;

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
// CORS — only needed if you keep a separate
// dev frontend on a different port
// ==========================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevOnly", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
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
// ==========================================
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Inventory API v1");
    c.RoutePrefix = "swagger";
});

// ✅ Serve Angular from wwwroot
app.UseDefaultFiles();   // serves index.html for "/"
app.UseStaticFiles();    // serves JS/CSS/assets from wwwroot

// Only apply CORS in development (production is same-origin)
if (app.Environment.IsDevelopment())
{
    app.UseCors("DevOnly");
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ✅ Catch-all: lets Angular Router handle /products, /dashboard, etc.
// Must come AFTER MapControllers so API routes take priority
app.MapFallbackToFile("index.html");

// ==========================================
// DATABASE + SEED
// ==========================================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    DbSeeder.Seed(db);
}

app.Run();
