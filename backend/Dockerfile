# Build Angular
FROM node:20 AS angular-build
WORKDIR /app

COPY frontend/package*.json ./ 
RUN npm install

COPY frontend/ .
RUN npx ng build --configuration production

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

# copiar Angular build
COPY --from=angular-build /app/dist /app/wwwroot

ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

EXPOSE 8080

ENTRYPOINT ["dotnet", "InventoryAPI.dll"]
