---
phase: 02-core-api
plan: 01
subsystem: document-api
tags: [api, crud, auth, mongodb, tdd]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [document-endpoints, bearer-auth, body-size-limit]
  affects: [frontend-upload, viewer-page]
tech_stack:
  added: [MongoDB.Bson]
  patterns: [raw-json-storage, bearer-token-auth, kestrel-body-limit, minimal-api-endpoints]
key_files:
  created:
    - backend/ShareService.Api.Tests/DocumentsTests.cs
  modified:
    - backend/ShareService.Api/Program.cs
decisions:
  - Raw JSON string storage (payloadJson field) instead of BsonDocument — avoids extended JSON format corruption of routeCache data
  - DateTime truncated to millisecond precision before returning from POST — matches MongoDB BsonDateTime precision for consistent round-trip
metrics:
  duration: 4m
  completed: "2026-03-21T14:25:00Z"
---

# Phase 02 Plan 01: Document API Endpoints Summary

Raw JSON string storage with bearer token auth — POST/GET/PUT endpoints with 13 integration tests using Mongo2Go TDD

## What Was Built

Three document API endpoints implemented in the existing `Program.cs` minimal API:

1. **POST /documents** — Authenticated upload of JSON payload. Generates UUID, stores raw JSON string in MongoDB, returns `{id, url, createdAt}` with 201.
2. **GET /documents/{id}** — Public read. Returns stored JSON payload exactly as uploaded. No authentication required.
3. **PUT /documents/{id}** — Authenticated replacement. Replaces payload while preserving original `createdAt`. Returns `{id, url, createdAt}` with 200.

Supporting infrastructure:
- **IsAuthorized helper** — Compares Bearer token from Authorization header to `Auth:JwtSecret` config value
- **Kestrel body size limit** — 5 MB max request body size configured at the server level
- **Raw JSON string storage** — Payload stored as `payloadJson` string field in MongoDB, not as BsonDocument, ensuring perfect round-trip fidelity for complex nested data like `routeCache`

## Task Execution

| # | Task | Type | Commit | Status |
|---|------|------|--------|--------|
| 1 | RED: Write 13 integration tests | test (TDD RED) | d22b9c1 | ✅ |
| 2 | GREEN: Implement endpoints + auth | feat (TDD GREEN) | 258ee2c | ✅ |

## Test Results

**16 total tests passing** (3 existing + 13 new):

| Test | Status |
|------|--------|
| Post_WithValidToken_Returns201WithIdUrlCreatedAt | ✅ |
| Post_WithoutToken_Returns401 | ✅ |
| Post_WithInvalidToken_Returns401 | ✅ |
| Post_WithEmptyBody_Returns400 | ✅ |
| Post_WithInvalidJson_Returns400 | ✅ |
| Post_PreservesRouteCache | ✅ |
| Post_OversizedPayload_Returns413 | ✅ |
| Get_ExistingDocument_ReturnsPayload | ✅ |
| Get_NonExistentDocument_Returns404 | ✅ |
| Put_WithValidToken_ReplacesPayload | ✅ |
| Put_WithoutToken_Returns401 | ✅ |
| Put_NonExistentDocument_Returns404 | ✅ |
| Put_PreservesCreatedAt | ✅ |
| Health_ReturnsOkWithStatus_WhenAllConfigProvided | ✅ |
| Startup_Throws_WhenJwtSecretMissing | ✅ |
| Startup_Throws_WhenCorsAllowedOriginsMissing | ✅ |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DateTime precision mismatch in Put_PreservesCreatedAt**
- **Found during:** Task 2 (GREEN)
- **Issue:** POST returned `createdAt` with full .NET tick precision, but MongoDB BsonDateTime stores only millisecond precision. When PUT retrieved and returned the value, the serialized string differed from POST's original.
- **Fix:** Truncated `DateTime.UtcNow` to millisecond precision before storing and returning: `new DateTime(DateTime.UtcNow.Ticks / TimeSpan.TicksPerMillisecond * TimeSpan.TicksPerMillisecond, DateTimeKind.Utc)`
- **Files modified:** backend/ShareService.Api/Program.cs
- **Commit:** 258ee2c

## Decisions Made

1. **Raw JSON string storage** — Store uploaded payload as `payloadJson` string field rather than MongoDB BsonDocument. This avoids BsonDocument extended JSON serialization issues (e.g., `{"$numberInt": "5"}` instead of `5`) that would corrupt routeCache data on round-trip.
2. **Millisecond DateTime truncation** — Truncate `DateTime.UtcNow` to millisecond precision before returning from POST, ensuring consistency with MongoDB BsonDateTime storage for subsequent PUT operations.

## Verification

```
dotnet test backend/ShareService.Api.Tests --verbosity normal → 16 passed, 0 failed
dotnet build backend/ShareService.Api → Build succeeded, 0 errors
MapPost/MapGet/MapPut count in Program.cs → 4 (health + 3 document endpoints)
[Fact] count in DocumentsTests.cs → 13
```

## Self-Check: PASSED

All files exist, all commits verified.
