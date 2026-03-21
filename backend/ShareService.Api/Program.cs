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

var app = builder.Build();

// --- Middleware ---
app.UseCors("Frontend");
app.UseStaticFiles();

// --- Endpoints ---
app.MapGet("/health", async (IMongoClient client) =>
{
    var db = client.GetDatabase("admin");
    await db.RunCommandAsync<MongoDB.Bson.BsonDocument>(
        new MongoDB.Bson.BsonDocument("ping", 1));
    return Results.Ok(new { status = "ok" });
});

app.Run();
