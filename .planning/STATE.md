# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-21)

**Core value:** Make route export data easy to publish and share without passing JSON files around manually
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-03-21 — Completed 01-01-PLAN: API scaffold with fail-fast config and health endpoint

Progress: [█░░░░░░░░░] 10%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 3m
- Total execution time: 3m

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 1 | 3m | 3m |

**Recent Trend:**
- Last 5 plans: 3m
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: Random opaque ID (not content hash) — stable URL must survive payload replacement
- Roadmap: Shared bearer token auth (no login endpoint) — pre-generated JWT, no `/auth/token` route
- Roadmap: `UseStaticFiles()` in .NET, 2-service Compose (api + mongo) — no nginx container
- Roadmap: Preserve `routeCache` in stored documents — shared payloads should keep cached routing data intact
- Roadmap: Fly.io + MongoDB Atlas M0 as free hosting target — persistent VMs, no spin-down
- Roadmap: Viewer page is v1 (Phase 3), not deferred — improves recipient experience
- 01-01: Require() helper throws InvalidOperationException for missing env vars — fail-fast at startup
- 01-01: InternalsVisibleTo for WebApplicationFactory access — standard .NET testing pattern
- 01-01: Mongo2Go for ephemeral MongoDB in tests — no Docker dependency for CI

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 4: Fly.io egress IP behavior with Atlas M0 IP allowlist — may require `0.0.0.0/0` (acceptable for v1 small-team tool; document the tradeoff in README)

## Session Continuity

Last session: 2026-03-21
Stopped at: Completed 01-01-PLAN.md — API scaffold with fail-fast config
Resume file: None
