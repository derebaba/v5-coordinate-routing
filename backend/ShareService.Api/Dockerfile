FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/ShareService.Api/ShareService.Api.csproj .
RUN dotnet restore

COPY backend/ShareService.Api/ .
# Copy frontend assets so /edit/{id} can serve them via UseStaticFiles
COPY index.html ./wwwroot/index.html
COPY app.js ./wwwroot/app.js
COPY styles.css ./wwwroot/styles.css
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "ShareService.Api.dll"]
