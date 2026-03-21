using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Mongo2Go;
using Xunit;

namespace ShareService.Api.Tests;

public class ViewerTests : IDisposable
{
    private readonly MongoDbRunner _mongoRunner;
    private readonly HttpClient _client;

    public ViewerTests()
    {
        _mongoRunner = MongoDbRunner.Start();

        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("Mongo:ConnectionString", _mongoRunner.ConnectionString);
                builder.UseSetting("Mongo:DatabaseName", "test-db");
                builder.UseSetting("Auth:JwtSecret", "test-secret-value");
                builder.UseSetting("Cors:AllowedOrigins", "http://localhost:3000");
            });

        _client = factory.CreateClient();
    }

    public void Dispose()
    {
        _mongoRunner.Dispose();
    }

    [Fact]
    public async Task Viewer_ReturnsHtml_ForAnyId()
    {
        var response = await _client.GetAsync("/viewer/some-test-id");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("<!doctype html>", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Viewer_ReturnsHtml_ForNonExistentDocumentId()
    {
        var response = await _client.GetAsync("/viewer/does-not-exist-in-db");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
    }
}
