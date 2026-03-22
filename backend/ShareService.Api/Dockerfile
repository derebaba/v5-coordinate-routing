FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/ShareService.Api/ShareService.Api.csproj .
RUN dotnet restore

COPY backend/ShareService.Api/ .
RUN dotnet publish -c Release -o /app/publish && \
    BUILD_TS=$(date +%s) && \
    sed -i "s|href=\"styles\.css\"|href=\"styles.css?v=${BUILD_TS}\"|g" /app/publish/wwwroot/index.html && \
    sed -i "s|src=\"app\.js\"|src=\"app.js?v=${BUILD_TS}\"|g" /app/publish/wwwroot/index.html

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "ShareService.Api.dll"]
