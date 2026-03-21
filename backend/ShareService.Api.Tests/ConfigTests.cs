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
                builder.UseSetting("Mongo__ConnectionString", "mongodb://localhost:27017");
                builder.UseSetting("Mongo__DatabaseName", "test-db");
                // Auth__JwtSecret intentionally omitted
                builder.UseSetting("Cors__AllowedOrigins", "http://localhost:3000");
            });

        // Assert
        var ex = Assert.Throws<InvalidOperationException>(() => factory.CreateClient());
        Assert.Contains("Missing required config: Auth__JwtSecret", ex.Message);
    }

    [Fact]
    public void Startup_Throws_WhenCorsAllowedOriginsMissing()
    {
        // Arrange & Act
        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("Mongo__ConnectionString", "mongodb://localhost:27017");
                builder.UseSetting("Mongo__DatabaseName", "test-db");
                builder.UseSetting("Auth__JwtSecret", "test-secret-at-least-32-characters-long!");
                // Cors__AllowedOrigins intentionally omitted
            });

        // Assert
        var ex = Assert.Throws<InvalidOperationException>(() => factory.CreateClient());
        Assert.Contains("Missing required config: Cors__AllowedOrigins", ex.Message);
    }
}
