# Stack Research

**Domain:** Small-team route JSON sharing web app (upload → hash URL → public view / authenticated replace)
**Researched:** 2026-03-21
**Confidence:** HIGH — well-trodden .NET + MongoDB pattern; choices verified against current official docs and community consensus

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| .NET / ASP.NET Core | **9.0** (latest) or **8.0** (LTS until Nov 2026) | HTTP API + static file host | Required by project. Minimal APIs are the current standard for lean .NET services — no MVC controller boilerplate. .NET 9 is the November 2024 release; use 8 LTS if you need longer support window. |
| MongoDB | **7.x** | NoSQL document store for route JSON payloads | Document-oriented model is a natural fit for arbitrary JSON. Official `mongo:7` Docker image. Atlas free M0 tier (512 MB) covers deployment. Well-supported by `MongoDB.Driver` for .NET. |
| Docker Compose | **v2** (bundled with Docker Desktop) | Local full-stack orchestration | Two-service Compose file (api + mongo) gives the team a single `docker compose up` to reproduce the full environment. No third service needed if .NET serves static files. |
| JWT Bearer Auth | Built into ASP.NET Core 8/9 (`Microsoft.AspNetCore.Authentication.JwtBearer`) | Protecting write/replace endpoints | Built-in, zero extra infrastructure. Issue a token at login using a team secret stored in env vars; no Identity server required for a small team. |

### Supporting Libraries (NuGet)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `MongoDB.Driver` | **3.x** (current) | .NET ↔ MongoDB CRUD | Required. Replaces the old 2.x driver; v3 is async-first and aligns with .NET 8/9 cancellation token patterns. |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | Matches .NET version (no extra install on .NET 8/9 — already in the framework) | JWT validation middleware | Required for authenticated replace endpoint. Add `builder.Services.AddAuthentication().AddJwtBearer(...)`. |
| `System.Security.Cryptography` | Built into .NET BCL | SHA-256 hash generation for URL slugs | Use `SHA256.HashData(payload)` → hex string → first 16 chars = document slug. Stable: same JSON body always produces the same slug. |
| `Swashbuckle.AspNetCore` | **6.x** | Swagger/OpenAPI UI in development | Useful while building; disable in production. Add `if (app.Environment.IsDevelopment()) app.UseSwaggerUI()`. |
| `Microsoft.Extensions.Options` | BCL | Typed configuration binding (`appsettings.json` + env vars) | Standard pattern. Bind `MongoDbSettings`, `JwtSettings`, etc. to strongly-typed classes. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Docker Desktop | Run `docker compose up` locally | Required. Compose v2 is included. Use the official `mongo:7` image, not `latest`, so the version is pinned. |
| `dotnet watch` | Hot-reload during .NET development | `dotnet watch run` inside the API project; works inside Docker if you mount source. |
| MongoDB Compass | GUI inspection of the MongoDB database | Connect to `mongodb://localhost:27017` during local dev. Free download, not required but speeds up debugging. |
| Fly CLI (`flyctl`) | Deploy to Fly.io from CI or terminal | `fly deploy` reads a `fly.toml` in the repo root. Free tier: 3 shared-cpu-1x VMs + 3 GB persistent disk. |

---

## Project-Specific Architecture Notes

### Static File Serving

Serve `index.html`, `app.js`, and `styles.css` directly from the .NET app using `app.UseStaticFiles()` and `app.MapFallbackToFile("index.html")`. This keeps Docker Compose to **two services** (api + mongo) and avoids an nginx container.

```
wwwroot/
  index.html      ← existing frontend (copied/linked at build)
  app.js
  styles.css
```

### Hash URL Pattern

Generate the document slug server-side using SHA-256 of the raw request body:

```csharp
var hash = Convert.ToHexString(SHA256.HashData(rawBytes))[..16].ToLower();
// → "a3f8c2d14e7b9012"
// Stored as the document's _id field in MongoDB
```

**Same export → same URL** (idempotent upload). A `PUT /routes/{hash}` endpoint allows authenticated replacement behind the same URL.

### Auth Model (Minimal)

No user database needed for v1. Store a single team secret in env vars and issue a JWT at `POST /auth/token`:

```
TEAM_USERNAME=team
TEAM_PASSWORD=<bcrypt-hashed or plaintext for v1>
JWT_SECRET=<long random string>
```

Protect `PUT /routes/{hash}` with `[Authorize]`. All `GET /routes/{hash}` endpoints remain public.

---

## Installation

```bash
# Create .NET Minimal API project
dotnet new webapi -n RouteShare.Api --use-minimal-apis

# Add NuGet packages
dotnet add package MongoDB.Driver
dotnet add package Swashbuckle.AspNetCore

# JWT Bearer is already in the ASP.NET Core 8/9 shared framework
# No separate install needed — just configure in Program.cs
```

```yaml
# docker-compose.yml (two services)
services:
  api:
    build: .
    ports:
      - "5000:8080"
    environment:
      - MONGODB_URI=mongodb://mongo:27017
      - MONGODB_DB=routeshare
      - JWT_SECRET=change-me-before-deploy
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo_data:
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| MongoDB 7 | **Redis** | Only if payloads are tiny and you need sub-millisecond latency; lacks rich document query support — wrong fit here |
| MongoDB 7 | **Azure Cosmos DB (MongoDB wire)** | Only if the team is already deep in Azure and has a paid subscription; free tier is very limited and local dev requires the emulator |
| MongoDB Atlas (free M0) | **Self-hosted MongoDB on Fly.io** | If you need >512 MB storage in production and are willing to manage volumes; Atlas is simpler for first deployment |
| Fly.io | **Render** | If you prefer Git-push deploys over CLI; Render's free tier spins down after 15 min idle — not great for a shared link tool that must load instantly |
| Fly.io | **Railway** | Equally good DX; Railway gives $5/month free credit vs Fly.io's always-free VM tier; either works |
| ASP.NET Core Minimal APIs | **MVC Controllers** | Only if the team already has MVC conventions or needs scaffolding; Minimal APIs are the current .NET guidance for new small services |
| Built-in JWT Bearer | **ASP.NET Core Identity** | Only if you need user registration, password reset, roles, and email flows; Identity is heavy for a 3-endpoint small-team app |
| SHA-256 slug (content-addressed) | **Random UUID / NanoId** | Use NanoId if you want each upload to always get a unique URL even for identical content; content-addressing is better here because re-uploads don't proliferate links |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **SQL Server / PostgreSQL** | JSON payloads stored in `JSONB` or `nvarchar(max)` technically works but fights the project's NoSQL requirement and adds schema migration overhead for data with no fixed schema | MongoDB 7 |
| **Firebase / Firestore** | Vendor lock-in to Google Cloud; the .NET SDK is not first-class; no Docker-local emulator story that integrates cleanly with .NET | MongoDB 7 + Atlas |
| **DynamoDB** | AWS-specific; complex SDK for .NET; no official local Docker image that matches production behavior closely; overkill for a small-team app | MongoDB 7 with `mongo:7` Docker |
| **ASP.NET Core Identity** | Adds a full user-management framework (migrations, EF Core, email services) when the team only needs one authenticated endpoint | Lightweight JWT with env-var credentials |
| **React / Next.js / Vite** | The existing `index.html` + `app.js` is a working vanilla JS app; rewriting it adds weeks with no functional gain | Extend the existing frontend with `fetch()` calls to the new API |
| **nginx as a separate container** | Adds a third Docker service for something `UseStaticFiles()` handles natively | `app.UseStaticFiles()` + `MapFallbackToFile("index.html")` |
| **`mongo:latest` Docker tag** | Tags like `latest` drift silently; a MongoDB minor update can introduce unexpected behaviour in local dev | Pin to `mongo:7` |

---

## Stack Patterns by Variant

**If the team wants the absolute simplest auth (no login endpoint):**
- Use a static API key in a request header (`X-Api-Key: <secret>`)
- Validate with a simple middleware against an env var
- Eliminates the JWT setup entirely; fine for a small team with a single shared secret

**If route JSON payloads grow large (>1 MB per document):**
- Store the raw payload in MongoDB GridFS or upload to S3-compatible object storage (e.g., Cloudflare R2 free tier — 10 GB/month free)
- Store only the metadata and a reference URL in MongoDB
- This is unlikely to be needed in v1 but worth knowing

**If the team needs history / audit trail later:**
- Add a `versions` array to each MongoDB document storing previous payloads with timestamps
- No schema change needed — just extend the document shape

**If deployment moves beyond free tier:**
- Fly.io paid plans are inexpensive ($2–5/month for the app container)
- Upgrade MongoDB Atlas M0 → M2 ($9/month) for 2 GB and dedicated resources

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `MongoDB.Driver` 3.x | .NET 8 + .NET 9 | v3 dropped .NET Framework support; stick to v3 for new projects |
| `MongoDB.Driver` 2.x | .NET 6/7/8 | Use only if targeting a legacy runtime; v2 is still maintained but v3 is preferred for new code |
| `mongo:7` Docker image | MongoDB.Driver 3.x | Wire protocol compatible; no special config needed |
| `Swashbuckle.AspNetCore` 6.x | ASP.NET Core 8 | Works correctly; Swashbuckle 7.x targets .NET 9 OpenAPI natively — either is fine |
| JWT Bearer (ASP.NET Core 8/9) | `MongoDB.Driver` 3.x | No interaction; independent middleware |

---

## Sources

- ASP.NET Core Minimal APIs — https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis — **HIGH confidence** (official docs)
- MongoDB .NET Driver v3 — https://www.mongodb.com/docs/drivers/csharp/current/ — **HIGH confidence** (official docs)
- MongoDB Atlas Free Tier — https://www.mongodb.com/pricing — **HIGH confidence** (verified pricing page: M0 is free)
- Fly.io Free Tier — https://fly.io/docs/about/pricing/ — **MEDIUM confidence** (official pricing page; free tier terms can change)
- `Microsoft.AspNetCore.Authentication.JwtBearer` — https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn — **HIGH confidence** (official docs)
- Docker Compose v2 — https://docs.docker.com/compose/ — **HIGH confidence** (official docs)
- `mongo:7` Docker Hub image — https://hub.docker.com/_/mongo — **HIGH confidence** (official image page)

---

*Stack research for: small-team route JSON sharing web app*
*Researched: 2026-03-21*
