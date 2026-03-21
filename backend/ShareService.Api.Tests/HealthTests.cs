using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Mongo2Go;
using Xunit;

namespace ShareService.Api.Tests;

public class HealthTests : IDisposable
{
    private readonly MongoDbRunner _mongoRunner;

    public HealthTests()
    {
        _mongoRunner = MongoDbRunner.Start();
    }

    public void Dispose()
    {
        _mongoRunner.Dispose();
    }

    [Fact]
    public async Task Health_ReturnsOkWithStatus_WhenAllConfigProvided()
    {
        // Arrange
        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("Mongo__ConnectionString", _mongoRunner.ConnectionString);
                builder.UseSetting("Mongo__DatabaseName", "test-db");
                builder.UseSetting("Auth__JwtSecret", "test-secret-at-least-32-characters-long!");
                builder.UseSetting("Cors__AllowedOrigins", "http://localhost:3000");
            });

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.Equal("ok", json.RootElement.GetProperty("status").GetString());
    }
}
