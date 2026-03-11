# ============================================================
# Stage 1 — Build
# ============================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY InventoryAPI/InventoryAPI.csproj InventoryAPI/
RUN dotnet restore InventoryAPI/InventoryAPI.csproj

# Copy all source code and publish
COPY InventoryAPI/ InventoryAPI/
WORKDIR /src/InventoryAPI
RUN dotnet publish -c Release -o /app/publish --no-restore

# ============================================================
# Stage 2 — Runtime
# ============================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Create a folder for the SQLite database with write permissions
RUN mkdir -p /app/data && chmod 777 /app/data

# Copy published output
COPY --from=build /app/publish .

# Render injects the PORT environment variable — ASP.NET must use it
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose default port (Render overrides this via $PORT)
EXPOSE 8080

ENTRYPOINT ["dotnet", "InventoryAPI.dll"]
