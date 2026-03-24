using MongoDB.Bson;
using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

// --- Fail-fast environment config ---
string Require(string key)
{
    var value = builder.Configuration[key];
    if (string.IsNullOrWhiteSpace(value))
        throw new InvalidOperationException($"Missing required config: {key}");
    return value;
}

var mongoConnectionString = Require("Mongo:ConnectionString");
var mongoDatabaseName = Require("Mongo:DatabaseName");
var jwtSecret = Require("Auth:JwtSecret");
var allowedOriginsRaw = Require("Cors:AllowedOrigins");

const long MaxBodySize = 5 * 1024 * 1024; // 5 MB

var allowedOrigins = allowedOriginsRaw
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

// --- Services ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddSingleton<IMongoClient>(new MongoClient(mongoConnectionString));
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(mongoDatabaseName));

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = MaxBodySize;
});

var app = builder.Build();

// --- Middleware ---
app.UseCors("Frontend");

void ApplyNoCacheHeaders(HttpResponse response)
{
    response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
    response.Headers.Pragma = "no-cache";
    response.Headers.Expires = "0";
}

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx => ApplyNoCacheHeaders(ctx.Context.Response)
});

app.MapGet("/", async (HttpContext ctx, IWebHostEnvironment env) =>
{
    ApplyNoCacheHeaders(ctx.Response);
    var filePath = Path.Combine(env.WebRootPath, "index.html");
    if (!File.Exists(filePath))
        return Results.NotFound();
    var html = await File.ReadAllTextAsync(filePath);
    return Results.Content(html, "text/html");
});

bool IsAuthorized(HttpContext ctx)
{
    var header = ctx.Request.Headers.Authorization.ToString();
    if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        return false;
    var token = header["Bearer ".Length..].Trim();
    return token == jwtSecret;
}

// --- Endpoints ---
app.MapGet("/health", async (IMongoClient client) =>
{
    var db = client.GetDatabase("admin");
    await db.RunCommandAsync<MongoDB.Bson.BsonDocument>(
        new MongoDB.Bson.BsonDocument("ping", 1));
    return Results.Ok(new { status = "ok" });
});

app.MapGet("/documents", async (HttpContext ctx, IMongoDatabase db) =>
{
    if (!IsAuthorized(ctx))
        return Results.Json(new { error = "Missing or invalid bearer token." }, statusCode: 401);

    var collection = db.GetCollection<BsonDocument>("documents");
    var projection = Builders<BsonDocument>.Projection
        .Include("_id")
        .Include("createdAt")
        .Include("updatedAt");

    var docs = await collection
        .Find(new BsonDocument())
        .Project(projection)
        .SortByDescending(d => d["updatedAt"])
        .ToListAsync();

    var result = docs.Select(d => new
    {
        id = d["_id"].AsString,
        createdAt = d["createdAt"].ToUniversalTime(),
        updatedAt = d["updatedAt"].ToUniversalTime()
    });

    return Results.Json(result);
});

app.MapPost("/documents", async (HttpContext ctx, IMongoDatabase db) =>
{
    if (!IsAuthorized(ctx))
        return Results.Json(new { error = "Missing or invalid bearer token." }, statusCode: 401);

    if (ctx.Request.ContentLength > MaxBodySize)
        return Results.Json(new { error = "Payload exceeds 5 MB limit." }, statusCode: 413);

    string body;
    try
    {
        body = await new StreamReader(ctx.Request.Body).ReadToEndAsync();
    }
    catch (BadHttpRequestException)
    {
        return Results.Json(new { error = "Payload exceeds 5 MB limit." }, statusCode: 413);
    }

    if (string.IsNullOrWhiteSpace(body))
        return Results.Json(new { error = "Request body is required." }, statusCode: 400);

    try
    {
        using var jsonDoc = System.Text.Json.JsonDocument.Parse(body);
    }
    catch (System.Text.Json.JsonException)
    {
        return Results.Json(new { error = "Invalid JSON payload." }, statusCode: 400);
    }

    var id = Guid.NewGuid().ToString("D").ToLowerInvariant();
    var now = new DateTime(DateTime.UtcNow.Ticks / TimeSpan.TicksPerMillisecond * TimeSpan.TicksPerMillisecond, DateTimeKind.Utc);

    var doc = new BsonDocument
    {
        { "_id", id },
        { "createdAt", now },
        { "updatedAt", now },
        { "payloadJson", body }
    };

    var collection = db.GetCollection<BsonDocument>("documents");
    await collection.InsertOneAsync(doc);

    var url = $"{ctx.Request.Scheme}://{ctx.Request.Host}/edit/{id}";

    return Results.Json(new { id, url, createdAt = now }, statusCode: 201);
});

app.MapGet("/documents/{id}", async (string id, IMongoDatabase db) =>
{
    var collection = db.GetCollection<BsonDocument>("documents");
    var doc = await collection.Find(new BsonDocument("_id", id)).FirstOrDefaultAsync();

    if (doc == null)
        return Results.Json(new { error = "Document not found." }, statusCode: 404);

    var payloadJson = doc["payloadJson"].AsString;
    return Results.Content(payloadJson, "application/json");
});

app.MapPut("/documents/{id}", async (string id, HttpContext ctx, IMongoDatabase db) =>
{
    if (!IsAuthorized(ctx))
        return Results.Json(new { error = "Missing or invalid bearer token." }, statusCode: 401);

    if (ctx.Request.ContentLength > MaxBodySize)
        return Results.Json(new { error = "Payload exceeds 5 MB limit." }, statusCode: 413);

    string body;
    try
    {
        body = await new StreamReader(ctx.Request.Body).ReadToEndAsync();
    }
    catch (BadHttpRequestException)
    {
        return Results.Json(new { error = "Payload exceeds 5 MB limit." }, statusCode: 413);
    }

    if (string.IsNullOrWhiteSpace(body))
        return Results.Json(new { error = "Request body is required." }, statusCode: 400);

    try
    {
        using var jsonDoc = System.Text.Json.JsonDocument.Parse(body);
    }
    catch (System.Text.Json.JsonException)
    {
        return Results.Json(new { error = "Invalid JSON payload." }, statusCode: 400);
    }

    var collection = db.GetCollection<BsonDocument>("documents");
    var existing = await collection.Find(new BsonDocument("_id", id)).FirstOrDefaultAsync();

    if (existing == null)
        return Results.Json(new { error = "Document not found." }, statusCode: 404);

    var createdAt = existing["createdAt"].ToUniversalTime();
    var now = DateTime.UtcNow;

    var replacement = new BsonDocument
    {
        { "_id", id },
        { "createdAt", createdAt },
        { "updatedAt", now },
        { "payloadJson", body }
    };

    await collection.ReplaceOneAsync(new BsonDocument("_id", id), replacement);

    var url = $"{ctx.Request.Scheme}://{ctx.Request.Host}/edit/{id}";

    return Results.Json(new { id, url, createdAt });
});

app.MapGet("/viewer/{id}", async (string id, HttpContext ctx, IWebHostEnvironment env) =>
{
    ApplyNoCacheHeaders(ctx.Response);
    var filePath = Path.Combine(env.WebRootPath, "viewer.html");
    if (!File.Exists(filePath))
        return Results.NotFound();
    var html = await File.ReadAllTextAsync(filePath);
    return Results.Content(html, "text/html");
});

app.MapGet("/edit/{id}", async (string id, HttpContext ctx, IWebHostEnvironment env) =>
{
    ApplyNoCacheHeaders(ctx.Response);
    var filePath = Path.Combine(env.WebRootPath, "index.html");
    if (!File.Exists(filePath))
        return Results.NotFound();
    var html = await File.ReadAllTextAsync(filePath);
    html = html.Replace("<head>", "<head>\n  <base href=\"/\">");
    return Results.Content(html, "text/html");
});

app.Run();
