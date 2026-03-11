FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/InventoryAPI/InventoryAPI.csproj InventoryAPI/
RUN dotnet restore InventoryAPI/InventoryAPI.csproj

COPY backend/InventoryAPI/ InventoryAPI/
WORKDIR /src/InventoryAPI
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

RUN mkdir -p /app/data && chmod 777 /app/data

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "InventoryAPI.dll"]
