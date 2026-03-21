# Phase 2: Core API - Research

**Researched:** 2026-03-21
**Domain:** ASP.NET Core 8 Minimal API — document CRUD endpoints with bearer token auth and MongoDB storage
**Confidence:** HIGH

## Summary

Phase 2 adds three endpoints (`POST /documents`, `GET /documents/{id}`, `PUT /documents/{id}`) to the existing .NET 8 Minimal API scaffold. The foundation from Phase 1 provides a working `Program.cs` with fail-fast config, MongoDB `IMongoClient`/`IMongoDatabase` singletons via DI, CORS policy from env vars, and a `/health` endpoint — all using Minimal API style (`app.MapGet`). The `Auth:JwtSecret` config value is already loaded and validated at startup.

The recommended approach is simple bearer token string comparison (not JWT signature verification) since the project uses a shared team secret with no login endpoint and no per-user identity. Documents are stored as raw `BsonDocument` payloads in MongoDB with UUID string IDs, `createdAt`/`updatedAt` timestamps, and no payload parsing. Request body size is limited to 5 MB via Kestrel's `MaxRequestBodySize` configuration.

**Primary recommendation:** Use custom middleware for bearer token string comparison against `Auth:JwtSecret`, store payloads as `BsonDocument` in a `documents` collection, generate `Guid.NewGuid()` IDs, and enforce 5 MB body limit via `builder.WebHost.ConfigureKestrel()`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Document IDs are UUIDs (e.g., `550e8400-e29b-41d4-a716-446655440000`), generated server-side on POST
- POST `/documents` returns `{"id": "...", "url": "https://host/documents/...", "createdAt": "..."}`
- The full URL is built dynamically from the request's `Host` header (scheme + host + path)
- No additional env var needed for base URL — the API reads the incoming request context
- PUT `/documents/{id}` performs a full overwrite of the stored JSON payload — no merge
- No ownership tracking — anyone with the shared bearer token can replace any document
- PUT returns the same response shape as POST: `{"id": "...", "url": "...", "createdAt": "..."}`
- Documents track `createdAt` and `updatedAt` separately — PUT updates `updatedAt` only, `createdAt` reflects original upload time
- The frontend already reads `data.id || data._id` from the POST response — return `id` as the primary field
- Cities array within the uploaded JSON includes `routeCache` per city — store the entire payload as-is without stripping or transforming any fields
- The share URL in the response should be a full absolute URL (e.g., `http://localhost:5000/documents/550e8400-...`) so it's directly copyable

### Claude's Discretion
- Token validation approach (simple string match of bearer token against `Auth:JwtSecret` env var, or JWT signature verification)
- Error response format for 401, 404, 413 (JSON or plain text)
- MongoDB collection name and document schema design
- Whether to add an `updatedAt` field to the POST response or only on PUT responses
- Internal middleware ordering and request pipeline structure

### Deferred Ideas (OUT OF SCOPE)
- Frontend UI changes for displaying share URL / copy button — Phase 3
- Formatted viewer page for shared documents — Phase 3
- Deployment configuration and hosting — Phase 4
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Team member can authorize upload and replace actions by entering a shared bearer token | Simple string match middleware against `Auth:JwtSecret`; token sent as `Authorization: Bearer <token>` from frontend (app.js line 5829) |
| AUTH-02 | Unauthenticated users can open shared document URLs without signing in | `GET /documents/{id}` has no auth middleware — public endpoint |
| DOC-01 | Team member can upload exported route JSON from the existing frontend | `POST /documents` accepts `{schemaVersion, selectedCityId, cities}` JSON body matching frontend payload at app.js line 5814-5818 |
| DOC-02 | Backend returns a stable share ID and shareable URL after successful upload | UUID v4 generated server-side; response includes `{id, url, createdAt}` with full absolute URL built from `HttpRequest` |
| DOC-03 | Team member can replace JSON stored behind existing share ID without changing URL | `PUT /documents/{id}` full overwrite; same UUID, same URL; `updatedAt` updated |
| DOC-04 | Shared documents are stored in a NoSQL database | MongoDB `documents` collection; `IMongoDatabase` already in DI from Phase 1 |
| DOC-05 | Stored shared documents preserve `routeCache` data when persisted | Payload stored as raw `BsonDocument` — no parsing, no stripping, full fidelity |
| DOC-06 | Backend rejects oversized uploads with clear error response | Kestrel `MaxRequestBodySize = 5 * 1024 * 1024`; returns 413 with JSON error body |
| SHARE-03 | Anyone with a share URL can retrieve the shared route document as JSON | `GET /documents/{id}` returns the stored JSON payload, no auth required |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| ASP.NET Core 8.0 | .NET 8.0.419 | Minimal API HTTP framework | ✅ In project |
| MongoDB.Driver | 2.28.0 | MongoDB CRUD operations | ✅ In csproj |
| xUnit | 2.6.6 | Test framework | ✅ In test project |
| Mongo2Go | 3.1.3 | Ephemeral MongoDB for tests | ✅ In test project |
| Microsoft.AspNetCore.Mvc.Testing | 8.0.0 | WebApplicationFactory for integration tests | ✅ In test project |

### No Additional Packages Needed

No new NuGet packages are required for Phase 2. Specifically:

- **No `Microsoft.AspNetCore.Authentication.JwtBearer`** — The auth model is simple string comparison of the bearer token value against the `Auth:JwtSecret` config value. This is appropriate because there is no JWT signing/verification, no claims, no per-user identity, and no login endpoint. The token IS the secret.
- **No `Swashbuckle`** — The API has 3 endpoints; curl/test coverage is sufficient for v1.
- **UUID generation** — `System.Guid.NewGuid()` is built into .NET BCL.
- **JSON handling** — `System.Text.Json` is built into ASP.NET Core 8.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Simple string match auth | Full JWT Bearer middleware (`AddAuthentication().AddJwtBearer()`) | JWT adds claims, expiration, standard validation — overkill for shared secret with no per-user identity; adds complexity with no benefit for v1 |
| `BsonDocument` storage | Typed C# model deserialization of payload | Typed model couples backend to frontend schema; breaks when `schemaVersion` changes; raw storage keeps backend schema-free |
| `Guid.NewGuid()` | `RandomNumberGenerator.GetBytes(4)` → hex | GUID is standard, 128-bit, impossible to brute force; short hex is cute but GUID is safer and has native MongoDB support |

## Architecture Patterns

### Recommended Project Structure
```
backend/ShareService.Api/
├── Program.cs              # Existing — add endpoints, auth middleware, body size config
└── ShareService.Api.csproj # Existing — no new packages

backend/ShareService.Api.Tests/
├── HealthTests.cs          # Existing
├── ConfigTests.cs          # Existing
├── DocumentsTests.cs       # NEW — POST/GET/PUT integration tests
└── ShareService.Api.Tests.csproj
```

All new code goes in `Program.cs` using the existing Minimal API pattern. The project is small enough (3 endpoints + 1 health) that a single file remains maintainable. Extract to extension methods only if `Program.cs` exceeds ~200 lines.

### Pattern 1: Bearer Token String Match Middleware
**What:** Custom middleware extracts the `Authorization: Bearer <token>` header and compares the token value directly to `Auth:JwtSecret`. No JWT parsing, no claims extraction.
**When to use:** When auth is a single shared secret with no per-user identity, no expiration, and no claims.
**Why chosen:** The project uses pre-generated tokens shared via secure channel (STATE.md decision). There's no login endpoint, no user database, no token rotation. Simple string comparison is the minimal correct implementation.

```csharp
// In Program.cs — a reusable auth check as a local function or filter
bool IsAuthorized(HttpContext ctx)
{
    var header = ctx.Request.Headers.Authorization.ToString();
    if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        return false;
    var token = header["Bearer ".Length..].Trim();
    return token == jwtSecret;  // jwtSecret captured from Require("Auth:JwtSecret")
}
```

**Applied to endpoints:**
```csharp
app.MapPost("/documents", async (HttpContext ctx, IMongoDatabase db) =>
{
    if (!IsAuthorized(ctx))
        return Results.Json(new { error = "Missing or invalid bearer token." }, statusCode: 401);
    // ... handler logic
});
```

### Pattern 2: Content-Opaque BsonDocument Storage
**What:** Accept the incoming JSON as a `JsonElement` or raw string, convert to `BsonDocument`, and store the entire payload without parsing or validating its internal structure.
**When to use:** When the API is a pass-through store and the payload schema is owned by the frontend.
**Why chosen:** The frontend owns `schemaVersion` and may evolve fields. Backend should never break on a frontend schema change.

```csharp
// Storing: Convert incoming JSON to BsonDocument for native MongoDB storage
var payloadBson = BsonDocument.Parse(payloadJsonString);

var doc = new BsonDocument
{
    { "_id", id },
    { "createdAt", DateTime.UtcNow },
    { "updatedAt", DateTime.UtcNow },
    { "payload", payloadBson }
};

await collection.InsertOneAsync(doc);
```

```csharp
// Retrieving: Convert BsonDocument back to JSON for HTTP response
var doc = await collection.Find(new BsonDocument("_id", id)).FirstOrDefaultAsync();
if (doc == null) return Results.Json(new { error = "Document not found." }, statusCode: 404);

var payload = doc["payload"].AsBsonDocument;
// Return the payload as the response body — the payload IS the document
return Results.Content(payload.ToJson(), "application/json");
```

### Pattern 3: URL Construction from HttpRequest
**What:** Build the full share URL dynamically from the incoming request context.
**When to use:** When the API runs behind varying hosts (localhost:5000, production domain) and no base URL env var is desired.

```csharp
string BuildDocumentUrl(HttpRequest request, string id)
{
    var scheme = request.Scheme;
    var host = request.Host.ToString();
    return $"{scheme}://{host}/documents/{id}";
}
```

### Pattern 4: Kestrel Request Body Size Limit
**What:** Configure Kestrel's `MaxRequestBodySize` to 5 MB globally and return 413 when exceeded.
**When to use:** When enforcing upload size limits before the body is fully read.

```csharp
// In Program.cs before builder.Build()
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 5 * 1024 * 1024; // 5 MB
});
```

**Important:** Kestrel returns a generic error when the body exceeds this limit. To return a clean JSON 413 response, also check `Content-Length` in the endpoint handler:
```csharp
if (ctx.Request.ContentLength > 5 * 1024 * 1024)
    return Results.Json(new { error = "Payload exceeds 5 MB limit." }, statusCode: 413);
```

### Anti-Patterns to Avoid
- **Typed payload model:** Do NOT create a `RoutePayload` C# class to deserialize the uploaded JSON. This couples the backend to the frontend schema and breaks on every schema version bump.
- **MongoDB ObjectId as document ID:** Do NOT use MongoDB's default `ObjectId`. It's time-ordered and partially guessable. Use `Guid.NewGuid().ToString()` as the `_id` string.
- **`AllowAnonymous` / `[Authorize]` attributes:** These require the full authentication middleware pipeline. With simple string matching, use a local function check instead — it's simpler and explicit.
- **Parsing routeCache:** Do NOT strip, transform, or index `routeCache` data. Store the payload verbatim.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom random hex | `Guid.NewGuid().ToString()` | 128-bit, cryptographically random, zero collision risk, native MongoDB string _id support |
| JSON serialization | Manual string building | `System.Text.Json.JsonSerializer` / `Results.Json()` | Built into ASP.NET Core 8, handles edge cases (escaping, encoding) |
| Request body reading | `StreamReader` + manual parsing | `ctx.Request.ReadFromJsonAsync<JsonElement>()` | Handles content negotiation, encoding, and size limits properly |
| MongoDB BsonDocument ↔ JSON | Manual field mapping | `BsonDocument.Parse()` / `.ToJson()` | MongoDB.Driver 2.28 handles all BSON type conversions correctly |
| URL encoding | String concatenation | `UriBuilder` or simple interpolation (UUIDs are URL-safe) | UUIDs contain only hex chars and hyphens — URL-safe by default |

## Common Pitfalls

### Pitfall 1: BsonDocument.ToJson() Output Format
**What goes wrong:** `BsonDocument.ToJson()` by default produces MongoDB Extended JSON (e.g., `{ "$date": "..." }` for dates, `{ "$oid": "..." }` for ObjectIds). This is not standard JSON and will confuse the frontend.
**Why it happens:** MongoDB's BSON types have no direct JSON equivalent, so the driver uses extended JSON notation.
**How to avoid:** When returning the payload, extract the `payload` BsonDocument and use `JsonOutputMode.CanonicalExtendedJson` or better yet, store the original raw JSON string alongside the BsonDocument and return that. Alternatively, use `MongoDB.Bson.IO.JsonWriterSettings` with `OutputMode = JsonOutputMode.RelaxedExtendedJson`.
**Recommended approach:** Store the raw JSON string in a separate field (`payloadJson`) and return that directly. Use the BsonDocument version for any future MongoDB queries. OR simply store the payload as a raw JSON string field only, not a BsonDocument.
**Warning signs:** Frontend receives `{"$date": {"$numberLong": "..."}}` instead of ISO date strings.

### Pitfall 2: Content-Length Not Available for Chunked Transfers
**What goes wrong:** Checking `ctx.Request.ContentLength` returns `null` for chunked transfer encoding. The 5 MB check is bypassed and Kestrel's hard limit produces a generic connection reset.
**Why it happens:** HTTP/1.1 allows `Transfer-Encoding: chunked` without `Content-Length`.
**How to avoid:** Set Kestrel's `MaxRequestBodySize` as the hard limit (this works for both chunked and content-length). Add a `Content-Length` pre-check as an optimization for better error messages when the header is present. Read the body with `ReadFromJsonAsync` and let Kestrel enforce the limit — then catch `BadHttpRequestException` with a middleware that returns JSON 413.
**Warning signs:** Large uploads get connection reset instead of clean 413 response.

### Pitfall 3: PUT to Non-Existent Document Creates Instead of 404
**What goes wrong:** Using MongoDB `ReplaceOneAsync` with `IsUpsert = true` (or the default upsert behavior) silently creates a new document when the ID doesn't exist.
**Why it happens:** Upsert is a convenient MongoDB pattern but violates REST semantics where PUT to a missing resource should 404.
**How to avoid:** Use `ReplaceOneAsync` without upsert. Check `result.MatchedCount == 0` and return 404.
```csharp
var result = await collection.ReplaceOneAsync(
    filter: new BsonDocument("_id", id),
    replacement: updatedDoc);
if (result.MatchedCount == 0)
    return Results.Json(new { error = "Document not found." }, statusCode: 404);
```

### Pitfall 4: GUID Format in URLs
**What goes wrong:** `Guid.NewGuid().ToString()` produces `550e8400-e29b-41d4-a716-446655440000` (with hyphens). Route matching and MongoDB queries work fine, but if the frontend later does string manipulation on the ID, inconsistent casing or format can cause mismatches.
**How to avoid:** Always use lowercase with hyphens: `Guid.NewGuid().ToString("D").ToLowerInvariant()`. Store this exact format as `_id` in MongoDB.

### Pitfall 5: Race Condition on PUT
**What goes wrong:** Two concurrent PUT requests to the same document ID — one overwrites the other's changes silently.
**Why it happens:** No optimistic concurrency (version check) on replace.
**How to avoid:** For v1, this is acceptable — the team is 2-5 people and concurrent edits are unlikely. Document the behavior. If needed later, add an `updatedAt` check (optimistic concurrency) to the filter.

## Code Examples

### Complete POST /documents Handler
```csharp
app.MapPost("/documents", async (HttpContext ctx, IMongoDatabase db) =>
{
    if (!IsAuthorized(ctx))
        return Results.Json(new { error = "Missing or invalid bearer token." }, statusCode: 401);

    // Read and validate body exists
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

    // Parse to validate it's valid JSON, then store
    BsonDocument payloadBson;
    try
    {
        payloadBson = BsonDocument.Parse(body);
    }
    catch (Exception)
    {
        return Results.Json(new { error = "Invalid JSON payload." }, statusCode: 400);
    }

    var id = Guid.NewGuid().ToString("D").ToLowerInvariant();
    var now = DateTime.UtcNow;

    var doc = new BsonDocument
    {
        { "_id", id },
        { "createdAt", now },
        { "updatedAt", now },
        { "payload", payloadBson }
    };

    var collection = db.GetCollection<BsonDocument>("documents");
    await collection.InsertOneAsync(doc);

    var url = $"{ctx.Request.Scheme}://{ctx.Request.Host}/documents/{id}";

    return Results.Json(new { id, url, createdAt = now }, statusCode: 201);
});
```

### Complete GET /documents/{id} Handler
```csharp
app.MapGet("/documents/{id}", async (string id, IMongoDatabase db) =>
{
    var collection = db.GetCollection<BsonDocument>("documents");
    var doc = await collection.Find(new BsonDocument("_id", id)).FirstOrDefaultAsync();

    if (doc == null)
        return Results.Json(new { error = "Document not found." }, statusCode: 404);

    // Return the payload as the response — use relaxed JSON output
    var payload = doc["payload"].AsBsonDocument;
    var settings = new MongoDB.Bson.IO.JsonWriterSettings
    {
        OutputMode = MongoDB.Bson.IO.JsonOutputMode.RelaxedExtendedJson
    };
    return Results.Content(payload.ToJson(settings), "application/json");
});
```

### Complete PUT /documents/{id} Handler
```csharp
app.MapPut("/documents/{id}", async (string id, HttpContext ctx, IMongoDatabase db) =>
{
    if (!IsAuthorized(ctx))
        return Results.Json(new { error = "Missing or invalid bearer token." }, statusCode: 401);

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

    BsonDocument payloadBson;
    try
    {
        payloadBson = BsonDocument.Parse(body);
    }
    catch (Exception)
    {
        return Results.Json(new { error = "Invalid JSON payload." }, statusCode: 400);
    }

    var collection = db.GetCollection<BsonDocument>("documents");
    var now = DateTime.UtcNow;

    // Fetch existing to preserve createdAt
    var existing = await collection.Find(new BsonDocument("_id", id)).FirstOrDefaultAsync();
    if (existing == null)
        return Results.Json(new { error = "Document not found." }, statusCode: 404);

    var createdAt = existing["createdAt"].ToUniversalTime();

    var replacement = new BsonDocument
    {
        { "_id", id },
        { "createdAt", createdAt },
        { "updatedAt", now },
        { "payload", payloadBson }
    };

    await collection.ReplaceOneAsync(new BsonDocument("_id", id), replacement);

    var url = $"{ctx.Request.Scheme}://{ctx.Request.Host}/documents/{id}";

    return Results.Json(new { id, url, createdAt });
});
```

### Integration Test Pattern (extends existing HealthTests pattern)
```csharp
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

    [Fact]
    public async Task Post_WithValidToken_ReturnsCreatedWithId()
    {
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "test-secret-value");

        var payload = new StringContent(
            """{"schemaVersion":5,"selectedCityId":"c1","cities":[]}""",
            System.Text.Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/documents", payload);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.TryGetProperty("id", out _));
        Assert.True(json.RootElement.TryGetProperty("url", out _));
    }

    [Fact]
    public async Task Post_WithoutToken_Returns401()
    {
        var payload = new StringContent("{}", System.Text.Encoding.UTF8, "application/json");
        var response = await _client.PostAsync("/documents", payload);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_ExistingDocument_ReturnsPayload()
    {
        // Create first
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "test-secret-value");
        var createResponse = await _client.PostAsync("/documents",
            new StringContent("""{"test":"data"}""", System.Text.Encoding.UTF8, "application/json"));
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync());
        var id = created.RootElement.GetProperty("id").GetString();

        // Read without auth
        _client.DefaultRequestHeaders.Authorization = null;
        var getResponse = await _client.GetAsync($"/documents/{id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
    }

    public void Dispose() => _mongoRunner.Dispose();
}
```

## Discretion Decisions (Researcher Recommendations)

### 1. Token Validation: Simple String Match ✅
**Recommendation:** Use direct string comparison of the bearer token against `Auth:JwtSecret`.
**Rationale:** No per-user identity needed, no token expiration, no claims. The shared secret IS the token. JWT verification would require a token generation step (CLI tool, script) that adds complexity with zero security benefit when everyone shares the same secret. If the team grows beyond 5 people in v2, upgrading to JWT is straightforward.

### 2. Error Response Format: JSON ✅
**Recommendation:** All error responses use `{ "error": "Human-readable message." }` with appropriate HTTP status codes.
**Rationale:** Consistent format; the frontend already handles `res.text()` on errors (app.js line 5840), but a structured JSON format is better practice and easier to parse programmatically if needed.

**Error responses:**
| Status | When | Body |
|--------|------|------|
| 400 | Empty body or invalid JSON | `{"error": "Request body is required."}` or `{"error": "Invalid JSON payload."}` |
| 401 | Missing or wrong bearer token | `{"error": "Missing or invalid bearer token."}` |
| 404 | Document ID not found | `{"error": "Document not found."}` |
| 413 | Payload > 5 MB | `{"error": "Payload exceeds 5 MB limit."}` |

### 3. MongoDB Collection: `documents` ✅
**Recommendation:** Collection named `documents` in the database configured by `Mongo:DatabaseName` (currently `coordinate-routing`).

### 4. MongoDB Document Schema
```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": ISODate("2026-03-21T12:00:00Z"),
  "updatedAt": ISODate("2026-03-21T12:00:00Z"),
  "payload": { /* entire frontend JSON stored as-is */ }
}
```
- `_id` is the UUID string — no separate `id` field needed
- `payload` stores the entire `{schemaVersion, selectedCityId, cities}` object including `routeCache`
- No indexes beyond `_id` (which is automatic) — query pattern is always by ID

### 5. `updatedAt` in POST Response: Include It ✅
**Recommendation:** Include `updatedAt` in both POST and PUT responses for consistency. On POST, `createdAt == updatedAt`. This keeps the response shape identical between POST and PUT, simplifying frontend handling.

**Final response shape (both POST and PUT):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "http://localhost:5000/documents/550e8400-...",
  "createdAt": "2026-03-21T12:00:00Z"
}
```
Note: CONTEXT.md locks the response to `{id, url, createdAt}` for POST and `{id, url, createdAt}` for PUT. Follow this exactly. Include `updatedAt` only internally in MongoDB, not in the HTTP response unless the planner decides otherwise.

### 6. Middleware Ordering
**Recommendation:** Keep existing order, add body size config before `Build()`:
1. `ConfigureKestrel` (body size limit) — before `builder.Build()`
2. `UseCors("Frontend")` — existing
3. `UseStaticFiles()` — existing
4. Endpoint handlers with inline auth checks — no auth middleware pipeline

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MongoDB.Driver 2.x typed `IMongoCollection<T>` | MongoDB.Driver 2.28.0 with `BsonDocument` (untyped) for schema-free storage | Current | Use `BsonDocument` when payload schema is frontend-owned |
| `[Authorize]` attribute + JWT middleware | Inline auth check for simple shared-secret scenarios | Pattern choice | Eliminates auth middleware pipeline overhead for 3-endpoint API |
| MVC Controllers with `[ApiController]` | Minimal API `app.MapGet/MapPost/MapPut` | .NET 6+ | Already established in Phase 1 `Program.cs` |
| `IFormFile` for uploads | Raw JSON body (`ReadFromJsonAsync<JsonElement>` or `StreamReader`) | Standard for JSON APIs | Frontend sends `application/json`, not multipart form |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | xUnit 2.6.6 + Mongo2Go 3.1.3 |
| Config file | `backend/ShareService.Api.Tests/ShareService.Api.Tests.csproj` |
| Quick run command | `dotnet test backend/ShareService.Api.Tests --verbosity quiet` |
| Full suite command | `dotnet test backend/ShareService.Api.Tests --verbosity normal` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | POST/PUT with valid bearer token succeeds | integration | `dotnet test --filter "Post_WithValidToken"` | ❌ Wave 0 |
| AUTH-01 | POST/PUT with missing/invalid token returns 401 | integration | `dotnet test --filter "Post_WithoutToken"` | ❌ Wave 0 |
| AUTH-02 | GET requires no authentication | integration | `dotnet test --filter "Get_ExistingDocument"` | ❌ Wave 0 |
| DOC-01 | POST stores document and returns 201 | integration | `dotnet test --filter "Post_WithValidToken_ReturnsCreated"` | ❌ Wave 0 |
| DOC-02 | POST response includes id, url, createdAt | integration | `dotnet test --filter "Post_ResponseShape"` | ❌ Wave 0 |
| DOC-03 | PUT replaces payload, URL unchanged | integration | `dotnet test --filter "Put_ReplacesPayload"` | ❌ Wave 0 |
| DOC-04 | Document persisted in MongoDB | integration | Verified via GET after POST in same test | ❌ Wave 0 |
| DOC-05 | routeCache preserved in stored document | integration | `dotnet test --filter "Post_PreservesRouteCache"` | ❌ Wave 0 |
| DOC-06 | Oversized payload returns 413 | integration | `dotnet test --filter "Post_OversizedPayload_Returns413"` | ❌ Wave 0 |
| SHARE-03 | GET returns stored JSON to anyone | integration | `dotnet test --filter "Get_ExistingDocument_ReturnsPayload"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `dotnet test backend/ShareService.Api.Tests --verbosity quiet`
- **Per wave merge:** `dotnet test backend/ShareService.Api.Tests --verbosity normal`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `backend/ShareService.Api.Tests/DocumentsTests.cs` — covers AUTH-01, AUTH-02, DOC-01 through DOC-06, SHARE-03
- [ ] Test helper method for creating authenticated `HttpClient` with the test bearer token (avoid duplication in every test)
- [ ] No new framework install needed — xUnit + Mongo2Go + WebApplicationFactory already in place

## Open Questions

1. **BsonDocument vs raw JSON string storage**
   - What we know: `BsonDocument.Parse(json)` stores data natively in BSON; `BsonDocument.ToJson()` with relaxed settings produces mostly-standard JSON but may still have edge cases with numeric types (Int64 vs Int32).
   - What's unclear: Whether the round-trip `JSON → BsonDocument → JSON` is perfectly lossless for the specific payload shapes (large numbers, nested arrays).
   - Recommendation: Test with a real exported payload during implementation. If round-trip issues appear, switch to storing the raw JSON string in a `payloadJson` string field and return that directly. This is a safe fallback — the planner should include a verification step for payload fidelity.

2. **Kestrel MaxRequestBodySize and IIS/reverse proxy**
   - What we know: Kestrel enforces `MaxRequestBodySize` correctly in Docker. In production behind a reverse proxy (Fly.io), the proxy may have its own limits.
   - What's unclear: Fly.io's default request body limit.
   - Recommendation: Set 5 MB at Kestrel level. Phase 4 (deployment) should verify Fly.io's limit and adjust if needed. Not a Phase 2 concern.

## Sources

### Primary (HIGH confidence)
- Existing `Program.cs` — Phase 1 scaffold with Minimal API, MongoDB DI, CORS, `Auth:JwtSecret` config
- Existing `HealthTests.cs` / `ConfigTests.cs` — Established test pattern with Mongo2Go + WebApplicationFactory
- `app.js` lines 5798-5850 — Frontend API contract: `POST /documents`, `Bearer` auth header, reads `data.id`
- `ShareService.Api.csproj` — Confirms .NET 8.0, MongoDB.Driver 2.28.0
- ASP.NET Core 8 Minimal APIs — https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis
- MongoDB.Driver 2.28 BsonDocument — https://www.mongodb.com/docs/drivers/csharp/current/

### Secondary (MEDIUM confidence)
- Kestrel `MaxRequestBodySize` — https://learn.microsoft.com/en-us/aspnet/core/mvc/models/file-uploads — default is ~28.6 MB, configurable per-server or per-endpoint
- `BsonDocument.ToJson()` output modes — MongoDB driver documentation on extended JSON formats

### Tertiary (LOW confidence)
- Round-trip fidelity of `JSON → BsonDocument → JSON` for complex nested payloads with `routeCache` — needs verification during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed and verified; 3 existing tests pass
- Architecture: HIGH — extends established `Program.cs` patterns from Phase 1; Minimal API + MongoDB.Driver are well-documented
- Pitfalls: HIGH — BsonDocument JSON serialization, body size limits, and PUT upsert behavior are well-known .NET/MongoDB patterns
- Auth approach: HIGH — simple string match is the minimal correct solution for shared-secret auth; upgrade path to JWT is clear

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable — .NET 8 LTS, MongoDB.Driver 2.28 is mature)
