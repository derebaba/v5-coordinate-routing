---
phase: 03-frontend-viewer
plan: 01
subsystem: viewer-route
tags: [api, viewer, routing, integration-tests]
dependency_graph:
  requires: [02-01]
  provides: [viewer-route, viewer-url-format]
  affects: [03-02]
tech_stack:
  added: []
  patterns: [fallback-html-route, static-file-serving]
key_files:
  created:
    - backend/ShareService.Api/wwwroot/viewer.html
    - backend/ShareService.Api.Tests/ViewerTests.cs
  modified:
    - backend/ShareService.Api/Program.cs
    - backend/ShareService.Api.Tests/DocumentsTests.cs
decisions:
  - "Viewer route serves static HTML regardless of document existence — client-side error handling"
  - "IWebHostEnvironment injected for WebRootPath resolution — standard ASP.NET Core DI pattern"
metrics:
  duration: 2m
  completed: "2026-03-21T15:07:19Z"
requirements: [VIEW-01, VIEW-02]
---

# Phase 03 Plan 01: Viewer Route & API URL Update Summary

Viewer fallback route serving placeholder HTML at `/viewer/{id}`, with POST/PUT share URLs updated from `/documents/{id}` to `/viewer/{id}` and 2 new integration tests.

## What Was Done

### Task 1: Add viewer route, update API URL, create wwwroot placeholder
**Commit:** `0c83b36`

- Created `backend/ShareService.Api/wwwroot/viewer.html` — minimal placeholder HTML page with `<title>Shared Route Document</title>`
- Updated POST `/documents` URL construction from `/documents/{id}` to `/viewer/{id}` so shareable links point to human-readable viewer
- Updated PUT `/documents/{id}` URL construction from `/documents/{id}` to `/viewer/{id}` for consistency
- Added `app.MapGet("/viewer/{id}")` fallback route before `app.Run()` — reads `viewer.html` from `WebRootPath` and serves with `text/html` content type
- Route accepts `id` parameter but doesn't use it server-side; viewer JavaScript will read it from `window.location.pathname`

### Task 2: Create ViewerTests + fix DocumentsTests URL assertion
**Commit:** `c3bc689`

- Created `backend/ShareService.Api.Tests/ViewerTests.cs` with 2 integration tests:
  - `Viewer_ReturnsHtml_ForAnyId` — verifies 200 OK, text/html content type, and doctype in body
  - `Viewer_ReturnsHtml_ForNonExistentDocumentId` — verifies 200 OK and text/html (client-side error handling)
- Fixed `DocumentsTests.cs` URL assertion from `Assert.Contains($"/documents/{id}", url)` to `Assert.Contains($"/viewer/{id}", url)`
- All 18 tests pass (16 existing + 2 new viewer tests)

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. **Viewer route serves static HTML regardless of document existence** — The `/viewer/{id}` route always returns 200 with the HTML page. Document existence checking happens client-side via JavaScript fetching `/documents/{id}`. This simplifies the server route and enables graceful client-side error display.
2. **IWebHostEnvironment injection for file path** — Used `env.WebRootPath` instead of hardcoded paths, following standard ASP.NET Core patterns for static file resolution.

## Verification Results

- `dotnet build backend/ShareService.Api` — ✅ Build succeeded, 0 warnings, 0 errors
- `dotnet test backend/ShareService.Api.Tests --verbosity normal` — ✅ 18/18 tests passed
- Viewer route exists: `MapGet("/viewer/{id}"` in Program.cs ✅
- URL field uses `/viewer/` in POST and PUT responses ✅
- `viewer.html` placeholder exists in wwwroot ✅
- ViewerTests.cs contains 2 `[Fact]` test methods ✅

## Self-Check: PASSED

All 4 files verified present. Both task commits (0c83b36, c3bc689) verified in git log.
