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
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Cria pasta para o SQLite
RUN mkdir -p /app/data && chmod 777 /app/data

# Copia a aplicação publicada
COPY --from=build /app/publish .

# Variáveis de ambiente
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "InventoryAPI.dll"]
