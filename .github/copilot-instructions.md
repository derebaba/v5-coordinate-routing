# Copilot Instructions for `v5-coordinate-routing`

## Build, test, and lint commands

- Build solution:
  - `dotnet build v5-coordinate-routing.sln -nologo`
- Run all tests:
  - `dotnet test v5-coordinate-routing.sln -nologo`
- Run a single test (method-level):
  - `dotnet test backend\ShareService.Api.Tests\ShareService.Api.Tests.csproj --filter "FullyQualifiedName~Health_ReturnsOkWithStatus_WhenAllConfigProvided" -nologo`
- Run a single test class:
  - `dotnet test backend\ShareService.Api.Tests\ShareService.Api.Tests.csproj --filter "FullyQualifiedName~ShareService.Api.Tests.HealthTests" -nologo`
- Start local stack (API + MongoDB) with Docker:
  - `docker compose up --build`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1`

There is no dedicated lint command configured in this repository.

## High-level architecture

- The repository hosts a .NET 8 minimal API (`backend\ShareService.Api`) and a static frontend served from `wwwroot` (`index.html`, `app.js`, `viewer.html`).
- The API persists shared scheduler payloads in MongoDB and serves/updates them via:
  - `POST /documents` (JWT token required, creates document)
  - `GET /documents/{id}` (public read)
  - `PUT /documents/{id}` (JWT token required, replace)
- Document payloads are stored as raw JSON string (`payloadJson`) in Mongo, then returned as `application/json` for round-trip fidelity.
- Static routing is split:
  - `/edit/{id}` serves `index.html` with `<base href="/">` injection to support edit-link entrypoint
  - `/viewer/{id}` serves read-only `viewer.html`
- Runtime wiring:
  - `UseStaticFiles()` + CORS policy `"Frontend"`
  - `Mongo__*`, `Auth__JwtSecret`, and `Cors__AllowedOrigins` come from environment variables
  - Docker compose maps host `5000` to container `8080` and runs Mongo as internal service `mongo`

## Key conventions in this codebase

- Configuration is fail-fast at startup: missing required keys throw `InvalidOperationException` (`Mongo:ConnectionString`, `Mongo:DatabaseName`, `Auth:JwtSecret`, `Cors:AllowedOrigins`).
- Auth is intentionally simple bearer-token equality against `Auth:JwtSecret` (not full JWT claims validation). Preserve this behavior unless explicitly changing auth model.
- Write endpoints enforce a 5 MB payload limit and return JSON error bodies (`401`, `400`, `404`, `413` paths are covered by tests).
- Shared document IDs are generated as lowercase GUID `"D"` format (`Guid.NewGuid().ToString("D").ToLowerInvariant()`); keep this format stable for link compatibility.
- Frontend state model is schema-driven (`SCHEMA_VERSION = 5`) and city-scoped:
  - top-level shape is `{ schemaVersion, selectedCityId, cities[] }`
  - each city carries its own `schools`, `dayPlans`, `researchers`, `researcherAssignments`, `dayVerifications`, and `routeCache`
- Route cache persistence is session-scoped and city-scoped in IndexedDB (`fieldworkSchedulerDB`, store `routeCache`) with key pattern:
  - `SESSION_ID::cityId::fromSchoolId::toSchoolId`
- School imports and route building normalize multilingual/legacy field aliases (`school_id`/`kod`, `anket`, `lat`/`lng`/`enlem`/`boylam`) in `app.js`; reuse existing normalization paths instead of introducing parallel parsers.
- Deployment/local env keys use ASP.NET double-underscore naming in `.env`/Fly secrets (for example `Auth__JwtSecret`, not colon notation).
