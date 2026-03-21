# Phase 1: Foundation - Research

**Researched:** 2026-03-21
**Domain:** Local Docker foundation for ASP.NET Core + MongoDB
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
#### Local run flow
- Use a single primary local startup path: `docker compose up --build`.
- The API should be reachable from the host on `http://localhost:5000`, matching the existing frontend placeholder in `index.html`.
- MongoDB should run as an internal Docker service and not require direct host access for normal app usage.
- The stack should include a basic health endpoint so local startup can be verified without guessing.

#### Config and secrets
- Store local secrets in a root `.env` file that is gitignored.
- Commit a root `.env.example` file with placeholders only, including Mongo connection, JWT secret, and allowed origins values.
- Do not hardcode secrets in source files, Docker files, or committed app settings.
- Keep configuration environment-driven from the first scaffold so later deployment uses the same pattern.

#### Repository structure
- Add the new .NET backend in a dedicated subdirectory rather than mixing server files into the existing static frontend root.
- Keep the current frontend files (`index.html`, `app.js`, `styles.css`) in place during this phase; this phase prepares the backend foundation rather than reorganizing frontend behavior.
- Prefer a layout that keeps Docker, backend source, and top-level docs easy to find from the repo root.

#### Docker reset and persistence workflow
- Use a named Docker volume for MongoDB data so local data survives normal `docker compose down` and restart cycles.
- Favor standard Docker Compose commands for reset/debug workflows instead of custom scripts in this phase.
- Document the common workflows clearly: start, rebuild, stop, view logs, and full reset when needed.

### Claude's Discretion
- Exact backend folder name and .NET project naming
- Exact container names and compose service names
- Exact health-check implementation details
- Whether to expose MongoDB to the host for optional debugging, as long as the default workflow stays simple

### Deferred Ideas (OUT OF SCOPE)
- Actual `/documents` endpoint behavior and payload handling — Phase 2
- Share URL rendering and copy UX — Phase 3
- Viewer page behavior and recipient experience — Phase 3
- Fly.io deployment specifics and Atlas production configuration — Phase 4
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OPS-01 | Team can start the full stack locally with Docker | Two-service Compose stack, dedicated backend folder, root `.env`, `docker compose up --build`, host port `5000`, `/health` smoke check |
| OPS-02 | Local Docker setup persists database data across restarts | Named `mongo_data` volume mounted to `/data/db`; document difference between `down` and `down -v` |
| OPS-03 | Project includes environment-based configuration for secrets and allowed origins | Root `.env` + committed `.env.example`, `.gitignore`, env-bound config in ASP.NET Core for Mongo connection, JWT secret, and allowed origins |
</phase_requirements>

## Summary

Phase 1 should establish a boring, standard local foundation: one ASP.NET Core 8 API container, one MongoDB 7 container, a root `.env` file for secrets, and a named Docker volume for database persistence. The current frontend already expects an API at `http://localhost:5000` and already stores an API base URL and JWT token in the browser, so the foundation work should keep that contract intact rather than inventing a different local topology.

The most important planning decision is to make configuration fail fast. Missing `JWT_SECRET`, `ALLOWED_ORIGINS`, or Mongo connection settings should break startup clearly instead of silently falling back to hardcoded defaults. That directly protects OPS-03 and prevents later deployment drift. The second important decision is to treat persistence as part of the initial scaffold, not a later improvement: use a named Mongo volume from day one and document that `docker compose down` preserves data while `docker compose down -v` is the destructive reset path.

This repository currently has no backend, no Docker Compose file, no `.gitignore`, and no test infrastructure detected. Plan Wave 0 work accordingly: scaffold the backend, add Compose, add env hygiene, add a health endpoint, and add at least one repeatable validation path for `docker compose up` + `GET /health`.

**Primary recommendation:** Use a two-service Docker Compose stack with a dedicated ASP.NET Core 8 Minimal API backend folder, root `.env` / `.env.example`, a named `mongo_data` volume, and a `/health` endpoint that verifies Mongo connectivity through environment-driven configuration.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ASP.NET Core Minimal API | 8 LTS | API host, config binding, CORS, health endpoint | Smallest standard .NET service shape for a new API scaffold |
| MongoDB Community Server image | 7.x | Local NoSQL document store in Docker | Matches project requirement for NoSQL and local container workflow |
| Docker Compose | v2 spec | Start api + mongo together with one command | Standard local orchestration path; directly satisfies OPS-01 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| MongoDB.Driver | 3.x | Register `MongoClient` and verify DB connectivity | Add in Phase 1 if `/health` should confirm Mongo wiring; definitely needed by Phase 2 |
| ASP.NET Core CORS middleware | Built into ASP.NET Core 8 | Read allowed origins from env and enforce browser access policy | Required once the existing frontend calls the API from a browser |
| .NET configuration providers | Built into ASP.NET Core 8 | Bind env vars into typed settings or validated options | Required for OPS-03; do not hand-roll env parsing beyond simple list splitting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Minimal API | MVC Controllers | Controllers are fine later, but Minimal API is faster for a foundation scaffold with one health route |
| Named volume | Bind mount host folder | Bind mounts are easier to inspect but create host-specific path issues; named volumes are the safer default |
| Two services (`api`, `mongo`) | Add nginx as third service | Extra service adds config and debugging overhead without solving a current Phase 1 problem |

**Installation:**
```bash
dotnet add backend/ShareService.Api package MongoDB.Driver
docker compose up --build
```

## Architecture Patterns

### Recommended Project Structure
```text
/
├── backend/
│   └── ShareService.Api/     # ASP.NET Core API project
├── docker-compose.yml        # Local stack entrypoint
├── .env.example              # Placeholder env vars only
├── .gitignore                # Must include .env
├── README.md                 # Start/stop/log/reset instructions
├── index.html                # Existing frontend stays in place
├── app.js                    # Existing frontend stays in place
└── styles.css                # Existing frontend stays in place
```

### Pattern 1: Root-orchestrated local stack
**What:** Keep Docker Compose, `.env`, and docs at repo root; keep server source in `backend/`.
**When to use:** Immediately. This is the local developer entrypoint for every future phase.
**Example:**
```yaml
# Source: project decisions in 01-CONTEXT.md + .planning/research/SUMMARY.md
services:
  api:
    build:
      context: .
      dockerfile: backend/ShareService.Api/Dockerfile
    env_file:
      - .env
    ports:
      - "5000:8080"
    depends_on:
      mongo:
        condition: service_started

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Pattern 2: Fail-fast environment binding
**What:** Read secrets and runtime settings from environment variables on startup and fail if required values are missing.
**When to use:** For Mongo connection string, JWT signing secret, and allowed origins.
**Example:**
```csharp
// Source: ASP.NET Core configuration pattern + project OPS-03 constraint
var builder = WebApplication.CreateBuilder(args);

string Require(string key) =>
    builder.Configuration[key] ?? throw new InvalidOperationException($"Missing required config: {key}");

var mongoConnectionString = Require("Mongo__ConnectionString");
var jwtSecret = Require("Auth__JwtSecret");
var allowedOrigins = Require("Cors__AllowedOrigins")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});
```

### Pattern 3: Health endpoint that proves wiring
**What:** Expose `GET /health` and make it validate enough of the stack to be meaningful.
**When to use:** In Phase 1, to confirm the API booted and can reach Mongo using container-network settings.
**Example:**
```csharp
// Source: ASP.NET Core Minimal API pattern + project success criteria
builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoConnectionString));

var app = builder.Build();

app.MapGet("/health", async (IMongoClient client, CancellationToken ct) =>
{
    await client.GetDatabase("admin")
        .RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1), cancellationToken: ct);

    return Results.Ok(new { status = "ok" });
});
```

### Pattern 4: Persistence by infrastructure, not code
**What:** Use a named Docker volume for Mongo persistence; do not add custom backup/reset scripts in this phase.
**When to use:** From the very first Compose file.
**Example:**
```yaml
# Source: 01-CONTEXT.md persistence decision
services:
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Anti-Patterns to Avoid
- **Using `localhost` for Mongo inside the API container:** Inside Docker, the API should connect to `mongo`, not `localhost`.
- **Hardcoding fallback secrets in `appsettings.json` or `Dockerfile`:** This makes OPS-03 look complete while still shipping secrets or unsafe defaults.
- **Exposing Mongo to the host by default:** It is optional for debugging only; the normal workflow should not require it.
- **Treating `/health` as a static 200 string only:** If it does not verify config and Mongo reachability, it is a weak phase gate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser origin handling | Manual `Access-Control-*` header logic | ASP.NET Core CORS middleware | Built-in middleware handles preflight and per-origin policy correctly |
| Secret/config loading | Custom `.env` parser in app code | Docker Compose `env_file` + ASP.NET Core env config | Less code, fewer parsing bugs, same pattern works in deployment |
| Persistence workflow | Custom reset scripts | Named Docker volume + documented `docker compose` commands | Docker already provides the correct lifecycle semantics |
| Health checking | Custom HTML/status page | Minimal API `/health` route, optionally with Mongo ping | Easier to automate and verify from shell/tests |
| JWT crypto setup | Homemade signing/parsing logic | ASP.NET Core auth configuration reading env secret | Reduces security footguns in later phases |

**Key insight:** Phase 1 should create infrastructure seams, not custom infrastructure code. The more this phase relies on built-in Docker and ASP.NET Core behaviors, the less rework Phase 2 will need.

## Common Pitfalls

### Pitfall 1: Mongo connection uses the wrong host
**What goes wrong:** API container cannot connect to Mongo even though Mongo is running.
**Why it happens:** Developers use `localhost` in the connection string from inside the API container.
**How to avoid:** In Docker, use the Compose service name, e.g. `mongodb://mongo:27017/...`.
**Warning signs:** `/health` returns 500; API logs show connection timeout or refused connection.

### Pitfall 2: `.env` hygiene is added too late
**What goes wrong:** Real secrets end up committed or copied into source files.
**Why it happens:** `.gitignore` is missing and developers create `.env` before ignore rules exist.
**How to avoid:** Add `.gitignore` with `.env` before anyone writes secrets locally.
**Warning signs:** Git status shows `.env`; secrets appear in `appsettings.*`, Dockerfiles, or README examples.

### Pitfall 3: Data disappears after a normal restart
**What goes wrong:** Mongo content is lost after `docker compose down` and `up`.
**Why it happens:** Mongo uses the container filesystem instead of a named volume.
**How to avoid:** Mount `/data/db` to a named volume such as `mongo_data`.
**Warning signs:** Any inserted test record disappears after recreating containers.

### Pitfall 4: `down -v` is confused with normal stop/start
**What goes wrong:** Team thinks persistence is broken when they actually deleted the volume.
**Why it happens:** `docker compose down -v` removes named volumes by design.
**How to avoid:** Document two separate workflows: normal stop/start and full reset.
**Warning signs:** Volume vanishes only after destructive reset commands.

### Pitfall 5: Allowed origins parsing is brittle
**What goes wrong:** Browser requests fail even though env vars look correct.
**Why it happens:** Comma-separated origins are not trimmed, or trailing slashes do not match expected origins.
**How to avoid:** Split with trimming; store clean origins like `http://localhost:5000,http://127.0.0.1:5500` as needed.
**Warning signs:** CORS errors in browser console while direct curl requests still work.

### Pitfall 6: Health endpoint is green while required config is missing
**What goes wrong:** `/health` returns 200 but the app is not actually deployable.
**Why it happens:** Health endpoint does not depend on env-bound services.
**How to avoid:** Build the route after config validation and, ideally, include a Mongo ping.
**Warning signs:** `/health` works even when `JWT_SECRET` or Mongo connection string is absent.

## Code Examples

Verified patterns from project evidence and standard ASP.NET Core/Docker usage:

### Root `.env.example`
```dotenv
# Source: 01-CONTEXT.md locked decisions
Mongo__ConnectionString=mongodb://mongo:27017/coordinate-routing
Mongo__DatabaseName=coordinate-routing
Auth__JwtSecret=replace-with-long-random-secret
Cors__AllowedOrigins=http://localhost:5000
```

### Minimal `Program.cs` foundation shape
```csharp
// Source: project requirements OPS-01/02/03 + standard Minimal API scaffold
using MongoDB.Bson;
using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

string Require(string key) =>
    builder.Configuration[key] ?? throw new InvalidOperationException($"Missing required config: {key}");

var mongoConnectionString = Require("Mongo__ConnectionString");
var jwtSecret = Require("Auth__JwtSecret");
var allowedOrigins = Require("Cors__AllowedOrigins")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoConnectionString));
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("Frontend");

app.MapGet("/health", async (IMongoClient client, CancellationToken ct) =>
{
    await client.GetDatabase("admin")
        .RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1), cancellationToken: ct);

    return Results.Ok(new { status = "ok" });
});

app.Run();
```

### Compose persistence and host port mapping
```yaml
# Source: 01-CONTEXT.md + existing frontend placeholder in index.html
services:
  api:
    ports:
      - "5000:8080"
    env_file:
      - .env

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Browser-only static app with no backend runtime | Dockerized ASP.NET Core API + Mongo local stack | Current project roadmap | Enables real upload/share workflow and repeatable local setup |
| Hardcoded/local ad-hoc config | Environment-driven configuration from day one | Locked in Phase 1 context | Prevents secret drift and keeps deployment path consistent |
| Disposable container storage | Named Docker volume for Mongo | Locked in Phase 1 context | Preserves local data across normal `down` / `up` cycles |
| Custom local tooling temptation | Standard `docker compose` workflow | Locked in Phase 1 context | Easier onboarding and less maintenance |

**Deprecated/outdated:**
- Hardcoded secrets in source, Dockerfiles, or committed settings: explicitly disallowed by the phase context.
- Mixing backend files into the current frontend root: explicitly disallowed by the phase context.
- Three-service local stack with nginx: unnecessary for this repo at this phase.

## Open Questions

1. **Should `/health` ping Mongo or only confirm API liveness?**
   - What we know: Success criteria require `/health` to confirm the stack is wired, and the API must read Mongo config from env.
   - What's unclear: Whether the team wants stricter readiness behavior or the simplest possible endpoint.
   - Recommendation: Make `/health` ping Mongo. It is a stronger phase gate and catches bad connection strings immediately.

2. **What should the backend folder/project name be?**
   - What we know: It must live in a dedicated subdirectory and stay easy to find from repo root.
   - What's unclear: Exact naming convention is left to Claude's discretion.
   - Recommendation: Use `backend/ShareService.Api` or similarly explicit naming; avoid generic names like `server`.

3. **Should Mongo be exposed to the host for optional debugging?**
   - What we know: Default workflow should not require host access to Mongo.
   - What's unclear: Whether the team values optional GUI inspection during development.
   - Recommendation: Do not expose it by default in Phase 1. If needed later, make it an opt-in compose override or commented port mapping.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — Wave 0 should add xUnit integration tests for the API plus a Docker Compose smoke check |
| Config file | none — see Wave 0 |
| Quick run command | `dotnet test` |
| Full suite command | `dotnet test && docker compose up -d --build && powershell -Command "try { $r = Invoke-WebRequest http://localhost:5000/health -UseBasicParsing; if ($r.StatusCode -ne 200) { exit 1 } } finally { docker compose down }"` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPS-01 | `docker compose up` starts API and Mongo; `/health` returns 200 | smoke | `docker compose up -d --build && powershell -Command "try { Invoke-WebRequest http://localhost:5000/health -UseBasicParsing | Out-Null } finally { docker compose down }"` | ❌ Wave 0 |
| OPS-02 | Mongo data survives `docker compose down` + `docker compose up` | smoke/integration | `docker compose up -d && powershell -Command "docker exec $(docker compose ps -q mongo) mongosh --quiet --eval \"db.getSiblingDB('coordinate-routing').phase1.insertOne({probe:'ok'})\"; docker compose down; docker compose up -d; docker exec $(docker compose ps -q mongo) mongosh --quiet --eval \"db.getSiblingDB('coordinate-routing').phase1.findOne({probe:'ok'})\"; docker compose down"` | ❌ Wave 0 |
| OPS-03 | JWT secret and allowed origins come from env, not code | integration | `dotnet test --filter OPS03` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `dotnet test`
- **Per wave merge:** `dotnet test && docker compose up -d --build && powershell -Command "try { $r = Invoke-WebRequest http://localhost:5000/health -UseBasicParsing; if ($r.StatusCode -ne 200) { exit 1 } } finally { docker compose down }"`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `backend/ShareService.Api.Tests/` — API integration tests covering config validation and `/health`
- [ ] `backend/ShareService.Api.Tests/HealthTests.cs` — covers OPS-01 and OPS-03
- [ ] `scripts/validate-foundation.ps1` or equivalent documented command — repeatable Docker smoke validation for OPS-01 and OPS-02
- [ ] `.gitignore` — must ignore `.env`
- [ ] `docker-compose.yml` — required for all phase smoke checks
- [ ] Framework install: `dotnet new xunit -o backend/ShareService.Api.Tests && dotnet add backend/ShareService.Api.Tests package Microsoft.AspNetCore.Mvc.Testing`

## Sources

### Primary (HIGH confidence)
- `.planning/phases/01-foundation/01-CONTEXT.md` - locked Phase 1 decisions, constraints, and out-of-scope items
- `.planning/REQUIREMENTS.md` - OPS-01, OPS-02, OPS-03 requirements and traceability
- `.planning/STATE.md` - current roadmap decisions affecting local stack shape
- `.planning/ROADMAP.md` - Phase 1 goal and success criteria
- `.planning/research/SUMMARY.md` - previously consolidated project research recommending ASP.NET Core + MongoDB + two-service Compose
- `index.html` lines 411-421 - existing frontend expects API base URL input with `http://localhost:5000`
- `app.js` lines 5798-5849 - existing frontend `POST`s to `${baseUrl}/documents` with bearer token, confirming expected local API contract

### Secondary (MEDIUM confidence)
- ASP.NET Core Minimal APIs docs - https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis
- ASP.NET Core configuration docs - https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration
- ASP.NET Core CORS docs - https://learn.microsoft.com/en-us/aspnet/core/security/cors
- MongoDB C# driver docs - https://www.mongodb.com/docs/drivers/csharp/current/
- Docker Compose docs - https://docs.docker.com/compose/
- MongoDB official Docker image docs - https://hub.docker.com/_/mongo

### Tertiary (LOW confidence)
- None. No additional unverified web findings were introduced in this research pass.

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Strongly supported by project artifacts and prior project research, but external docs were not fetched directly in this session
- Architecture: HIGH - Directly constrained by Phase 1 context, roadmap, and existing frontend expectations
- Pitfalls: HIGH - Derived from current repo state (missing backend, Compose, `.gitignore`, tests) and standard Docker/.NET failure modes

**Research date:** 2026-03-21
**Valid until:** 2026-04-20
