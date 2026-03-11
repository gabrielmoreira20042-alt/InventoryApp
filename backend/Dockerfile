# Stage 1 - Build Angular
FROM node:20 AS angular-build
WORKDIR /app
COPY frontend/ .
RUN npm install
RUN npm run build -- --configuration production

# Stage 2 - Build .NET
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/InventoryAPI/InventoryAPI.csproj InventoryAPI/
RUN dotnet restore InventoryAPI/InventoryAPI.csproj
COPY backend/InventoryAPI/ InventoryAPI/
# Copia o Angular build para wwwroot
COPY --from=angular-build /app/dist/inventory-frontend InventoryAPI/wwwroot/
RUN dotnet publish InventoryAPI/InventoryAPI.csproj -c Release -o /app/publish

# Stage 3 - Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
RUN mkdir -p /app/data && chmod 777 /app/data
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
EXPOSE 8080
ENTRYPOINT ["dotnet", "InventoryAPI.dll"]
