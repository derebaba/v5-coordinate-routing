---
phase: 01-foundation
plan: 01
subsystem: api
tags: [dotnet, aspnet-core, mongodb, xunit, mongo2go, docker, cors]

# Dependency graph
requires: []
provides:
  - "ASP.NET Core 8 Minimal API scaffold with fail-fast env config"
  - "MongoDB.Driver integration with IMongoClient singleton"
  - "GET /health endpoint that pings MongoDB"
  - "CORS policy driven by Cors__AllowedOrigins env var"
  - "Multi-stage Dockerfile exposing port 8080"
  - "xUnit test coverage for config validation and health endpoint"
affects: [01-02-PLAN, core-api]

# Tech tracking
tech-stack:
  added: [dotnet-8, mongodb-driver-2.28, xunit, mongo2go, microsoft-aspnet-mvc-testing]
  patterns: [fail-fast-config, env-driven-secrets, minimal-api]

key-files:
  created:
    - backend/ShareService.Api/Program.cs
    - backend/ShareService.Api/ShareService.Api.csproj
    - backend/ShareService.Api/Dockerfile
    - backend/ShareService.Api.Tests/ShareService.Api.Tests.csproj
    - backend/ShareService.Api.Tests/HealthTests.cs
    - backend/ShareService.Api.Tests/ConfigTests.cs
  modified: []

key-decisions:
  - "Require() helper throws InvalidOperationException for missing env vars — fail-fast at startup"
  - "InternalsVisibleTo grants test project access to top-level Program — standard pattern for WebApplicationFactory"
  - "Mongo2Go provides ephemeral MongoDB for tests — no Docker dependency in CI"

patterns-established:
  - "Fail-fast config: Require(key) pattern for mandatory environment variables"
  - "Named CORS policy: 'Frontend' with comma-split AllowedOrigins"
  - "Mongo DI: IMongoClient + IMongoDatabase registered as singletons"

requirements-completed: [OPS-03]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 1 Plan 1: API Scaffold Summary

**ASP.NET Core 8 Minimal API with fail-fast env binding, MongoDB health ping, and xUnit coverage via Mongo2Go**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T12:21:24Z
- **Completed:** 2026-03-21T12:24:46Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- .NET 8 API scaffold with MongoDB.Driver, multi-stage Dockerfile, and xUnit test project
- Fail-fast startup requiring Mongo__ConnectionString, Mongo__DatabaseName, Auth__JwtSecret, Cors__AllowedOrigins
- GET /health endpoint that pings MongoDB admin database and returns `{status: "ok"}`
- 3 passing xUnit tests: health endpoint via Mongo2Go, and two config-missing validation tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold the API project, Docker build, and test host** - `6aa9a0b` (chore)
2. **Task 2 RED: Failing tests for health and config** - `d4b6a02` (test)
3. **Task 2 GREEN: Implement fail-fast config, CORS, Mongo health** - `7c486ba` (feat)

**Plan metadata:** pending (docs: complete plan)

_Note: Task 2 used TDD flow with separate RED/GREEN commits_

## Files Created/Modified
- `backend/ShareService.Api/ShareService.Api.csproj` - API project targeting .NET 8 with MongoDB.Driver
- `backend/ShareService.Api/Program.cs` - Fail-fast config, CORS, UseStaticFiles, IMongoClient, /health
- `backend/ShareService.Api/Dockerfile` - Multi-stage build exposing port 8080
- `backend/ShareService.Api.Tests/ShareService.Api.Tests.csproj` - xUnit project with Mvc.Testing and Mongo2Go
- `backend/ShareService.Api.Tests/HealthTests.cs` - Health endpoint test with Mongo2Go + WebApplicationFactory
- `backend/ShareService.Api.Tests/ConfigTests.cs` - Config-missing startup validation tests

## Decisions Made
- Used Require() helper that throws InvalidOperationException for missing env vars — ensures fail-fast behavior at startup before any request is served
- Added InternalsVisibleTo in API csproj for WebApplicationFactory access — standard .NET testing pattern
- Used Mongo2Go for ephemeral MongoDB in tests — avoids Docker dependency for unit/integration testing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Xunit using directive to test files**
- **Found during:** Task 2 (RED phase)
- **Issue:** Test files compiled without `using Xunit;` — [Fact] attribute unresolved
- **Fix:** Added `using Xunit;` to both HealthTests.cs and ConfigTests.cs
- **Files modified:** HealthTests.cs, ConfigTests.cs
- **Verification:** Tests compile and run
- **Committed in:** d4b6a02 (test commit)

**2. [Rule 3 - Blocking] Added InternalsVisibleTo for Program accessibility**
- **Found during:** Task 2 (RED phase)
- **Issue:** WebApplicationFactory<Program> couldn't access top-level Program class
- **Fix:** Added InternalsVisibleTo in ShareService.Api.csproj
- **Files modified:** ShareService.Api.csproj
- **Verification:** Tests compile and WebApplicationFactory boots the app
- **Committed in:** d4b6a02 (test commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes are standard .NET boilerplate requirements. No scope creep.

## Issues Encountered
None — all tests passed on first implementation attempt after RED phase fixes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- API scaffold is ready for Docker Compose wiring in 01-02-PLAN
- Dockerfile exposes port 8080, ready for Compose port mapping to host 5000
- Environment variable contract established for .env file in next plan
- No blockers for Phase 1 Plan 2

## Self-Check: PASSED

All 7 files verified present. All 3 commits verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-21*
