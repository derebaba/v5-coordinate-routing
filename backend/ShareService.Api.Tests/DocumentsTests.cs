using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Mongo2Go;
using Xunit;

namespace ShareService.Api.Tests;

public class DocumentsTests : IDisposable
{
    private readonly MongoDbRunner _mongoRunner;
    private readonly HttpClient _client;

    public DocumentsTests()
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

    private void Authenticate()
    {
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", "test-secret-value");
    }

    private void ClearAuth()
    {
        _client.DefaultRequestHeaders.Authorization = null;
    }

    private StringContent JsonBody(string json)
    {
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    // --- POST tests ---

    [Fact]
    public async Task Post_WithValidToken_Returns201WithIdUrlCreatedAt()
    {
        Authenticate();

        var response = await _client.PostAsync("/documents",
            JsonBody("{\"schemaVersion\":5,\"selectedCityId\":\"c1\",\"cities\":[]}"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var id = json.RootElement.GetProperty("id").GetString();
        Assert.False(string.IsNullOrEmpty(id));

        var url = json.RootElement.GetProperty("url").GetString();
        Assert.Contains($"/viewer/{id}", url);

        Assert.True(json.RootElement.TryGetProperty("createdAt", out _));
    }

    [Fact]
    public async Task Post_WithoutToken_Returns401()
    {
        var response = await _client.PostAsync("/documents",
            JsonBody("{\"test\":\"data\"}"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.TryGetProperty("error", out _));
    }

    [Fact]
    public async Task Post_WithInvalidToken_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", "wrong-token");

        var response = await _client.PostAsync("/documents",
            JsonBody("{\"test\":\"data\"}"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Post_WithEmptyBody_Returns400()
    {
        Authenticate();

        var response = await _client.PostAsync("/documents",
            new StringContent("", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_WithInvalidJson_Returns400()
    {
        Authenticate();

        var response = await _client.PostAsync("/documents",
            JsonBody("not valid json{{{"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_PreservesRouteCache()
    {
        Authenticate();

        var payload = "{\"schemaVersion\":5,\"selectedCityId\":\"c1\",\"cities\":[{\"routeCache\":{\"key1\":\"value1\",\"nested\":{\"deep\":true}}}]}";
        var response = await _client.PostAsync("/documents", JsonBody(payload));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var id = json.RootElement.GetProperty("id").GetString();

        ClearAuth();
        var getResponse = await _client.GetAsync($"/documents/{id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var getJson = JsonDocument.Parse(await getResponse.Content.ReadAsStringAsync());
        var root = getJson.RootElement;
        var routeCache = root.GetProperty("cities")[0].GetProperty("routeCache");
        Assert.Equal("value1", routeCache.GetProperty("key1").GetString());
        Assert.True(routeCache.GetProperty("nested").GetProperty("deep").GetBoolean());
    }

    [Fact]
    public async Task Post_OversizedPayload_Returns413()
    {
        Authenticate();

        var big = new string('a', 5 * 1024 * 1024 + 1);
        var response = await _client.PostAsync("/documents",
            JsonBody($"{{\"data\":\"{big}\"}}"));

        Assert.Equal((HttpStatusCode)413, response.StatusCode);
    }

    // --- GET tests ---

    [Fact]
    public async Task Get_ExistingDocument_ReturnsPayload()
    {
        Authenticate();

        var response = await _client.PostAsync("/documents",
            JsonBody("{\"schemaVersion\":5,\"selectedCityId\":\"c1\",\"cities\":[]}"));
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var id = json.RootElement.GetProperty("id").GetString();

        ClearAuth();
        var getResponse = await _client.GetAsync($"/documents/{id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var getJson = JsonDocument.Parse(await getResponse.Content.ReadAsStringAsync());
        var root = getJson.RootElement;
        Assert.Equal(5, root.GetProperty("schemaVersion").GetInt32());
        Assert.Equal("c1", root.GetProperty("selectedCityId").GetString());
    }

    [Fact]
    public async Task Get_NonExistentDocument_Returns404()
    {
        var response = await _client.GetAsync("/documents/00000000-0000-0000-0000-000000000000");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.TryGetProperty("error", out _));
    }

    // --- PUT tests ---

    [Fact]
    public async Task Put_WithValidToken_ReplacesPayload()
    {
        Authenticate();

        var postResponse = await _client.PostAsync("/documents",
            JsonBody("{\"version\":\"original\"}"));
        var postJson = JsonDocument.Parse(await postResponse.Content.ReadAsStringAsync());
        var id = postJson.RootElement.GetProperty("id").GetString();
        var postUrl = postJson.RootElement.GetProperty("url").GetString();

        var putResponse = await _client.PutAsync($"/documents/{id}",
            JsonBody("{\"version\":\"replaced\"}"));
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        var putJson = JsonDocument.Parse(await putResponse.Content.ReadAsStringAsync());
        Assert.Equal(id, putJson.RootElement.GetProperty("id").GetString());
        Assert.Equal(postUrl, putJson.RootElement.GetProperty("url").GetString());

        ClearAuth();
        var getResponse = await _client.GetAsync($"/documents/{id}");
        var getJson = JsonDocument.Parse(await getResponse.Content.ReadAsStringAsync());
        Assert.Equal("replaced", getJson.RootElement.GetProperty("version").GetString());
    }

    [Fact]
    public async Task Put_WithoutToken_Returns401()
    {
        var response = await _client.PutAsync("/documents/any-id",
            JsonBody("{\"test\":\"data\"}"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Put_NonExistentDocument_Returns404()
    {
        Authenticate();

        var response = await _client.PutAsync("/documents/00000000-0000-0000-0000-000000000000",
            JsonBody("{\"test\":\"data\"}"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_PreservesCreatedAt()
    {
        Authenticate();

        var postResponse = await _client.PostAsync("/documents",
            JsonBody("{\"v\":1}"));
        var postJson = JsonDocument.Parse(await postResponse.Content.ReadAsStringAsync());
        var id = postJson.RootElement.GetProperty("id").GetString();
        var postCreatedAt = postJson.RootElement.GetProperty("createdAt").GetString();

        await Task.Delay(50);

        var putResponse = await _client.PutAsync($"/documents/{id}",
            JsonBody("{\"v\":2}"));
        var putJson = JsonDocument.Parse(await putResponse.Content.ReadAsStringAsync());
        var putCreatedAt = putJson.RootElement.GetProperty("createdAt").GetString();

        Assert.Equal(postCreatedAt, putCreatedAt);
    }
}
