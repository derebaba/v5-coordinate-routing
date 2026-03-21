---
phase: 01-foundation
plan: 02
subsystem: ops
tags: [docker, docker-compose, mongodb, env-config, gitignore, readme]

# Dependency graph
requires:
  - "01-01: ASP.NET Core 8 API scaffold with Dockerfile"
provides:
  - "Two-service Docker Compose stack (api + mongo) with one-command startup"
  - "Root .env.example contract for Mongo, JWT, and CORS config"
  - ".gitignore protecting .env secrets and build artifacts"
  - "README with local lifecycle commands and persistence probe"
affects: [02-core-api, deployment]

# Tech tracking
tech-stack:
  added: [docker-compose, mongo-7]
  patterns: [env-file-contract, named-volume-persistence, internal-only-mongo]

key-files:
  created:
    - .env.example
    - .gitignore
    - docker-compose.yml
  modified:
    - README.md
    - backend/ShareService.Api/Dockerfile
    - backend/ShareService.Api/Program.cs
    - backend/ShareService.Api.Tests/HealthTests.cs
    - backend/ShareService.Api.Tests/ConfigTests.cs

key-decisions:
  - "Config keys use : separator (Mongo:ConnectionString) — ASP.NET Core env var provider translates __ to : automatically"
  - "MongoDB internal-only with no host port mapping — simplest secure default for Phase 1"
  - "Cors__AllowedOrigins defaults include both localhost and 127.0.0.1 on port 5000"

patterns-established:
  - "Root .env.example as env contract, .env gitignored for secrets"
  - "Named Docker volume (mongo_data) for MongoDB persistence"
  - "docker compose up --build as single documented startup path"

requirements-completed: [OPS-01, OPS-02, OPS-03]

# Metrics
duration: 8min
completed: 2026-03-21
---

# Phase 1 Plan 2: Docker Compose & Local Workflow Summary

**Two-service Docker Compose stack with env contract, persistence, and documented operator workflow**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-21T12:27:28Z
- **Completed:** 2026-03-21T12:35:21Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Root `.env.example` with placeholders for Mongo, JWT, and CORS — `.env` gitignored
- `docker-compose.yml` with api service (5000:8080) and mongo service (internal only, named volume)
- Updated Dockerfile for repo-root build context
- README documenting full local lifecycle: start, rebuild, logs, stop, reset, persistence probe
- Fixed ASP.NET Core config key lookup bug (`__` → `:` separator)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create root env contract and two-service Compose stack** — `e0c369e` (chore)
2. **Task 2: Document local run, health-check, and persistence workflows** — `a3ea2e7` (feat)

## Files Created/Modified

- `.env.example` — Placeholder-only env contract for Mongo, JWT, CORS
- `.gitignore` — Protects .env, build artifacts, IDE/OS files
- `docker-compose.yml` — Two-service stack: api (port 5000:8080) + mongo (internal, named volume)
- `README.md` — Local stack quick start, common commands, persistence probe
- `backend/ShareService.Api/Dockerfile` — Updated COPY paths for repo-root build context
- `backend/ShareService.Api/Program.cs` — Config keys changed from `__` to `:` separator
- `backend/ShareService.Api.Tests/HealthTests.cs` — Updated config keys to `:` separator
- `backend/ShareService.Api.Tests/ConfigTests.cs` — Updated config keys to `:` separator

## Decisions Made

- Config keys use `:` separator (`Mongo:ConnectionString`) because ASP.NET Core's environment variable provider automatically translates `__` to `:` — using `__` in lookup keys silently fails at runtime
- MongoDB is internal-only (no `27017:27017` host mapping) — simplest secure default
- Default CORS origins include both `localhost` and `127.0.0.1` on port 5000

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated Dockerfile COPY paths for repo-root build context**
- **Found during:** Task 1
- **Issue:** docker-compose sets `context: .` (repo root) but Dockerfile COPY paths assumed context was `backend/ShareService.Api/`
- **Fix:** Changed `COPY ShareService.Api.csproj .` → `COPY backend/ShareService.Api/ShareService.Api.csproj .` and `COPY . .` → `COPY backend/ShareService.Api/ .`
- **Files modified:** backend/ShareService.Api/Dockerfile
- **Commit:** e0c369e

**2. [Rule 1 - Bug] Fixed ASP.NET Core config key lookup from `__` to `:` separator**
- **Found during:** Task 2 (Docker smoke test)
- **Issue:** `builder.Configuration["Mongo__ConnectionString"]` returns null at runtime because env var provider translates `__` to `:` when storing keys. Tests passed because `UseSetting` stores keys literally.
- **Fix:** Changed all config lookups in Program.cs from `Mongo__ConnectionString` to `Mongo:ConnectionString` pattern. Updated test files to match.
- **Files modified:** Program.cs, HealthTests.cs, ConfigTests.cs
- **Commit:** a3ea2e7

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes are essential for correct Docker runtime behavior. No scope creep.

## Verification Results

- ✅ `dotnet test` — 3/3 tests pass
- ✅ `docker compose config` — validates successfully
- ✅ `docker compose up -d --build` — both services start
- ✅ `http://localhost:5000/health` — returns `{"status":"ok"}`
- ✅ Persistence probe — data survives `docker compose down` + `docker compose up`
- ✅ All acceptance criteria (10 for Task 1, 6 for Task 2) verified

## Issues Encountered

None beyond the two auto-fixed deviations documented above.

## Next Phase Readiness

- Phase 1 Foundation is complete — API scaffold + Docker Compose + local workflow
- Ready for Phase 2: Core API endpoints (POST /documents, GET /documents/:id)
- Environment variable contract established for all future config needs
- Persistence proven and documented

## Self-Check: PASSED

All 8 files verified present. All 2 commits verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-21*
