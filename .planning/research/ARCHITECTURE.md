# Architecture Research

**Domain:** JSON document sharing service — static frontend + .NET API + NoSQL backend
**Researched:** 2026-03-21
**Confidence:** HIGH (based on direct code inspection of existing frontend + standard .NET/MongoDB patterns)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                     │
│                                                                   │
│  ┌──────────────────────────┐   ┌──────────────────────────┐     │
│  │  index.html / app.js     │   │  viewer.html / viewer.js │     │
│  │  (existing upload SPA)   │   │  (new read-only viewer)  │     │
│  │                          │   │                          │     │
│  │  • Export JSON           │   │  • Load by hash from URL │     │
│  │  • POST /documents (JWT) │   │  • GET /documents/{hash} │     │
│  │  • PUT /documents/{hash} │   │  • Render payload data   │     │
│  │  • Show returned URL     │   │  • No auth required      │     │
│  └──────────────┬───────────┘   └──────────────┬───────────┘     │
└─────────────────┼────────────────────────────── ┼ ────────────────┘
                  │ HTTP (fetch)                   │ HTTP (fetch)
┌─────────────────▼────────────────────────────── ▼ ────────────────┐
│  API LAYER  —  .NET Minimal API                                    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  DocumentsController                                          │ │
│  │                                                               │ │
│  │  POST   /documents          ← requires JWT Bearer token       │ │
│  │  GET    /documents/{hash}   ← public, no auth                 │ │
│  │  PUT    /documents/{hash}   ← requires JWT Bearer token       │ │
│  └────────────────────────────┬──────────────────────────────────┘ │
│                                │                                    │
│  ┌─────────────────────────────▼──────────────────────────────┐    │
│  │  DocumentService                                            │    │
│  │  • Generate random 8-char hex ID on create                  │    │
│  │  • CRUD against MongoDB                                     │    │
│  │  • Return { id, url } on create/replace                     │    │
│  └─────────────────────────────┬──────────────────────────────┘    │
└─────────────────────────────── ┼ ──────────────────────────────────┘
                                 │ MongoDB driver
┌────────────────────────────────▼──────────────────────────────────┐
│  DATA LAYER  —  MongoDB                                            │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Collection: documents                                        │ │
│  │  {                                                            │ │
│  │    _id:       "a1b2c3d4"          // random 8-char hex        │ │
│  │    createdAt: ISODate,                                        │ │
│  │    updatedAt: ISODate,                                        │ │
│  │    payload:   { ...raw JSON... }  // stored as-is, no schema  │ │
│  │  }                                                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|---------------|----------------|
| `index.html` + `app.js` | Export route JSON, upload to API, display returned share URL, trigger replace | Existing vanilla JS SPA — already has `onUploadToApi` and `PUT` support needed |
| `viewer.html` + `viewer.js` | Load document by hash from URL, render payload read-only | New lightweight HTML page, no framework needed |
| `nginx` (Docker) | Serve static files for both pages, proxy `/api/*` to .NET container | Eliminates CORS issues in Docker; single origin in prod |
| `.NET Minimal API` | Validate JWT, generate IDs, persist/retrieve documents | `Program.cs` + `DocumentsController` + `DocumentService` |
| `DocumentService` | Business logic: ID generation, MongoDB CRUD, response shaping | Injected via DI; keeps controller thin |
| `MongoDB` | Store JSON documents without enforcing a schema | Community edition Docker image |

---

## Recommended Project Structure

```
/
├── frontend/                    # Static files served by nginx
│   ├── index.html               # Existing upload SPA (copy/symlink)
│   ├── app.js                   # Existing logic (copy/symlink)
│   ├── styles.css               # Existing styles (copy/symlink)
│   └── viewer.html              # NEW: read-only document viewer
│
├── api/                         # .NET Minimal API project
│   ├── Controllers/
│   │   └── DocumentsController.cs   # POST / GET / PUT endpoints
│   ├── Models/
│   │   └── RouteDocument.cs         # MongoDB document model
│   ├── Services/
│   │   └── DocumentService.cs       # ID gen + MongoDB CRUD
│   ├── appsettings.json             # Non-secret config
│   ├── appsettings.Development.json # Local overrides
│   └── Program.cs                   # DI wiring, JWT config, CORS
│
├── nginx/
│   └── default.conf             # Proxy /api → api:5000, serve /
│
├── docker-compose.yml           # Wires frontend + api + db
└── .env.example                 # JWT_SECRET, MONGO_URI templates
```

### Structure Rationale

- **`frontend/`:** Keeps existing files intact — no framework change needed. nginx container serves them directly. The viewer page lives here as a peer, not a new SPA.
- **`api/`:** Standard .NET project layout. Minimal API keeps `Program.cs` as the entry point without MVC controller routing overhead.
- **`nginx/`:** A single nginx config that serves static files AND proxies `/api/*` to the .NET container removes CORS as a problem entirely — everything is same-origin from the browser's perspective.
- **`.env.example`:** Documents required secrets without committing them. Docker-compose reads from `.env` at runtime.

---

## Architectural Patterns

### Pattern 1: Content-Opaque Document Store

**What:** The API stores the JSON payload as a raw blob — it does not parse, validate, or index the payload fields. The `_id` is a randomly generated short hash, not derived from content.

**When to use:** When the payload format may evolve (schema versions already exist in the frontend) and the backend doesn't need to query inside the payload. This is the case here.

**Why random ID, not content hash:** The frontend already supports replacing content behind a fixed URL. A content-derived hash (SHA-256 of payload) would generate a new hash on every replace, breaking the shareable URL. Random ID keeps the URL stable across replacements.

**Trade-offs:** Simple, no schema migration required. Downside: no deduplication (same payload uploaded twice = two documents). Not an issue for this use case.

**Example:**
```csharp
// DocumentService.cs
public async Task<string> CreateAsync(JsonElement payload)
{
    var id = GenerateId();   // 8 random hex chars
    var doc = new RouteDocument {
        Id        = id,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
        Payload   = payload.GetRawText()   // store as raw string
    };
    await _collection.InsertOneAsync(doc);
    return id;
}

private static string GenerateId()
    => Convert.ToHexString(RandomNumberGenerator.GetBytes(4)).ToLowerInvariant();
```

### Pattern 2: Nginx Reverse Proxy for Same-Origin Static + API

**What:** A single nginx container serves `frontend/` at `/` and forwards requests to `/api/*` to the .NET container. The browser sees one origin; no CORS headers needed.

**When to use:** Whenever a static frontend and a separate API backend run in Docker-compose for local dev. Mirrors how most cloud deployments (Render, Railway, Fly.io) also work with a reverse proxy.

**Trade-offs:** Adds one Docker service. Eliminates CORS configuration entirely. Nginx config is ~10 lines.

**Example:**
```nginx
# nginx/default.conf
server {
    listen 80;

    location /api/ {
        proxy_pass         http://api:5000/;
        proxy_set_header   Host $host;
    }

    location / {
        root   /usr/share/nginx/html;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

### Pattern 3: Stateless JWT Auth with Env-Var Secret

**What:** The .NET API validates JWT Bearer tokens signed with a secret loaded from an environment variable. No user database, no token refresh. Team members hold long-lived tokens generated once.

**When to use:** Small internal tools where the number of authorized users is small and known. Adding a full OAuth/OIDC flow would cost more than the tool is worth at this stage.

**Trade-offs:** Simple to set up and reason about. Tokens can't be revoked individually (only by rotating the secret). Acceptable risk for a small team tool.

**Example:**
```csharp
// Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => {
        o.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JWT_SECRET"]!)),
            ValidateIssuer   = false,
            ValidateAudience = false
        };
    });
```

---

## Data Flow

### Flow 1 — Upload (New Document)

```
User clicks "Upload to API" in index.html
    ↓
app.js: onUploadToApi()  [already implemented]
    → POST /api/documents
      Headers: Authorization: Bearer <token>
               Content-Type: application/json
      Body:    { schemaVersion, selectedCityId, cities }
    ↓
.NET API: JWT middleware validates token
    ↓
DocumentsController.CreateAsync()
    ↓
DocumentService.CreateAsync(payload)
    → generates id = 8-char random hex
    → inserts { _id, createdAt, updatedAt, payload } into MongoDB
    ↓
Returns: HTTP 201  { "id": "a1b2c3d4" }
    ↓
app.js: displays shareable URL
    e.g. "http://localhost/viewer.html?id=a1b2c3d4"
```

### Flow 2 — Public View

```
Anyone opens: http://app/viewer.html?id=a1b2c3d4
    ↓
viewer.js: reads ?id param from URL
    → GET /api/documents/a1b2c3d4
      (no Authorization header)
    ↓
.NET API: no auth check on GET
    ↓
DocumentService.GetByIdAsync("a1b2c3d4")
    → MongoDB findOne { _id: "a1b2c3d4" }
    ↓
Returns: HTTP 200  { payload: { ... } }
    ↓
viewer.js: renders payload as human-readable output
```

### Flow 3 — Replace (Authenticated)

```
Team member: uploads new JSON to same hash URL
    ↓
app.js: PUT /api/documents/a1b2c3d4
      Headers: Authorization: Bearer <token>
      Body:    { new payload }
    ↓
.NET API: JWT middleware validates token
    ↓
DocumentService.ReplaceAsync("a1b2c3d4", newPayload)
    → MongoDB replaceOne { _id: "a1b2c3d4" }
    → updates updatedAt
    ↓
Returns: HTTP 200  { "id": "a1b2c3d4" }
    ↓
app.js: confirms "Updated. Same URL still works."
    Shareable URL unchanged ✓
```

---

## Docker-Compose Local Architecture

```yaml
# docker-compose.yml (structure, not final)
services:

  frontend:                   # nginx — port 80
    image: nginx:alpine
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    ports: ["80:80"]
    depends_on: [api]

  api:                        # .NET — port 5000 (internal only)
    build: ./api
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - MONGO_URI=mongodb://db:27017/routeshare
    depends_on: [db]

  db:                         # MongoDB — port 27017 (internal only)
    image: mongo:7
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

**Port exposure:** Only nginx (port 80) is exposed to the host. The API and MongoDB containers are internal-only — accessible by service name within Docker's network. This mirrors production topology where only the reverse proxy is public-facing.

---

## Suggested Build Order

The component dependency graph drives this order:

```
1. MongoDB container + .NET project scaffold
        ↓
2. DocumentService (CRUD) + GET/POST endpoints (no auth)
        ↓  ← test with curl / Swagger UI
3. Add JWT auth middleware + protect POST/PUT
        ↓  ← test with existing frontend upload flow (already wired)
4. nginx container + docker-compose wiring
        ↓  ← test full local stack end-to-end
5. viewer.html page + GET public view
        ↓
6. PUT replace endpoint + frontend replace UI
        ↓
7. Deployment config (env vars, free hosting target)
```

**Why this order:**
- Steps 1–2 unblock testing with the existing frontend immediately (the upload button already works)
- Auth is added in step 3 before any real data flows, not retrofitted later
- nginx comes after the API is verified to avoid debugging two unknowns at once
- Viewer page is step 5 because it depends on GET working, which is already done
- Replace endpoint is last because it's lowest priority and depends on the viewer confirming the hash URL pattern works

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–100 users (current) | Single docker-compose stack on one machine. MongoDB single node. JWT secret in env var. Fine as-is. |
| 100–10K users | Add MongoDB Atlas free tier for managed hosting. Consider document TTL (auto-expire old shares). nginx stays the same. |
| 10K+ users | This is a small team tool — reaching this scale would mean re-evaluating the product entirely, not just the architecture. |

**First bottleneck:** MongoDB disk space from large JSON payloads. Set a `maxDocumentSizeBytes` guard in DocumentService (MongoDB's 16 MB limit is the hard ceiling; enforce a soft limit of ~1 MB in the API).

**Second bottleneck:** Cold starts if hosted on a free-tier .NET container (Render/Railway spin-down). Mitigate with a health-check ping on the frontend page load.

---

## Anti-Patterns

### Anti-Pattern 1: Content-Derived Hash as Document ID

**What people do:** Hash the payload with SHA-256, use the hash as the `_id`.
**Why it's wrong:** The replace flow changes the payload → changes the hash → breaks the shareable URL. The whole point of replace is that the URL stays stable.
**Do this instead:** Generate a random ID on first create. The hash is the document's _address_, not its _fingerprint_.

### Anti-Pattern 2: Parsing / Validating Payload Fields in the API

**What people do:** Define a `RoutePayload` C# model, deserialize the incoming JSON into it, run validation attributes.
**Why it's wrong:** The payload schema is owned by the frontend and is already at `schemaVersion: 5`. Adding backend validation couples the API to the frontend schema — every frontend update requires a backend deploy.
**Do this instead:** Accept the payload as `JsonElement` (or `string`), store raw, return raw. Schema validation stays in the frontend.

### Anti-Pattern 3: Exposing MongoDB Directly to Docker Host

**What people do:** Map `27017:27017` in docker-compose to make it easy to browse from a GUI tool.
**Why it's wrong:** Fine for local dev, but becomes a habit that leaks into staging/prod config and exposes the database.
**Do this instead:** Keep MongoDB port internal. Use `docker exec -it <container> mongosh` or a Mongo GUI that connects through the Docker network (`localhost:27017` via port-forward when needed).

### Anti-Pattern 4: Building a Login Screen to Issue JWTs

**What people do:** Add a `POST /auth/login` endpoint with username/password, issue JWTs from it.
**Why it's wrong:** For a 2–5 person team, this adds more surface area (credential storage, hashing, login UI) than the value it provides.
**Do this instead:** Generate tokens once with a CLI script or an online JWT tool, share them with team members via a secure channel (1Password, Bitwarden). Rotate by changing `JWT_SECRET` in the env file.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None currently | — | The app is self-contained. Future: Google Maps API is already used in the route builder but is client-side only — no backend change needed. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `app.js` ↔ `.NET API` | HTTP fetch — `POST /api/documents`, `PUT /api/documents/{id}` | Already implemented in frontend. Backend must match these exact paths. |
| `viewer.js` ↔ `.NET API` | HTTP fetch — `GET /api/documents/{id}` | New viewer page; simple GET, no auth. |
| `nginx` ↔ `.NET API` | Docker internal network, `http://api:5000` | Service name `api` must match docker-compose service name. |
| `.NET API` ↔ `MongoDB` | MongoDB .NET driver, connection string from env var | `MONGO_URI=mongodb://db:27017/routeshare` — `db` = compose service name. |

---

## Sources

- Direct code inspection: `app.js` lines 5798–5850 (`onUploadToApi`), lines 5783–5796 (`onExportJson`), lines 5459–5477 (`onRouteBuilderExportJson`)
- Direct code inspection: `index.html` lines 415–420 (upload UI with JWT token input)
- MongoDB .NET Driver documentation: https://www.mongodb.com/docs/drivers/csharp/
- .NET Minimal API JWT: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/security
- Docker Compose networking: https://docs.docker.com/compose/networking/
- Pattern: Content-opaque document stores — standard NoSQL document API practice (HIGH confidence)

---

*Architecture research for: Coordinate Routing Share Service*
*Researched: 2026-03-21*

