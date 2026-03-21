using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace ShareService.Api.Tests;

public class ConfigTests
{
    [Fact]
    public void Startup_Throws_WhenJwtSecretMissing()
    {
        // Arrange & Act
        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("Mongo:ConnectionString", "mongodb://localhost:27017");
                builder.UseSetting("Mongo:DatabaseName", "test-db");
                // Auth:JwtSecret intentionally omitted
                builder.UseSetting("Cors:AllowedOrigins", "http://localhost:3000");
            });

        // Assert
        var ex = Assert.Throws<InvalidOperationException>(() => factory.CreateClient());
        Assert.Contains("Missing required config: Auth:JwtSecret", ex.Message);
    }

    [Fact]
    public void Startup_Throws_WhenCorsAllowedOriginsMissing()
    {
        // Arrange & Act
        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("Mongo:ConnectionString", "mongodb://localhost:27017");
                builder.UseSetting("Mongo:DatabaseName", "test-db");
                builder.UseSetting("Auth:JwtSecret", "test-secret-at-least-32-characters-long!");
                // Cors:AllowedOrigins intentionally omitted
            });

        // Assert
        var ex = Assert.Throws<InvalidOperationException>(() => factory.CreateClient());
        Assert.Contains("Missing required config: Cors:AllowedOrigins", ex.Message);
    }
}
