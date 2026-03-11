# Build Angular
FROM node:20 AS angular-build
WORKDIR /app
COPY frontend/package*.json ./ 
RUN npm install
COPY frontend/ .
RUN node ./node_modules/@angular/cli/bin/ng build --configuration production

# Build .NET
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/InventoryAPI/InventoryAPI.csproj InventoryAPI/
RUN dotnet restore InventoryAPI/InventoryAPI.csproj
COPY backend/InventoryAPI/ InventoryAPI/
WORKDIR /src/InventoryAPI
RUN dotnet publish -c Release -o /app/publish

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=angular-build /app/dist/inventory-frontend/browser /app/wwwroot

# ✅ Create the data directory and give write permissions
RUN mkdir -p /app/data && chmod 777 /app/data

ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
EXPOSE 8080
ENTRYPOINT ["dotnet", "InventoryAPI.dll"]
