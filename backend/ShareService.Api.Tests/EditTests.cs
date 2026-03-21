using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Mongo2Go;
using Xunit;

namespace ShareService.Api.Tests;

public class EditTests : IDisposable
{
    private readonly MongoDbRunner _mongoRunner;
    private readonly HttpClient _client;

    public EditTests()
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
    public async Task Edit_ReturnsHtml_ForAnyId()
    {
        var response = await _client.GetAsync("/edit/some-test-id");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("<!doctype html>", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Edit_ReturnsTextHtmlContentType()
    {
        var response = await _client.GetAsync("/edit/some-test-id");
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Edit_ResponseContainsBaseHrefTag()
    {
        var response = await _client.GetAsync("/edit/some-test-id");
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("<base href=\"/\">", body);
    }
}
