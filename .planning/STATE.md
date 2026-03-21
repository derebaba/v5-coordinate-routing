# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-21)

**Core value:** Make route export data easy to publish and share without passing JSON files around manually
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-03-21 — Roadmap created; all 19 v1 requirements mapped across 4 phases

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 4: Fly.io egress IP behavior with Atlas M0 IP allowlist — may require `0.0.0.0/0` (acceptable for v1 small-team tool; document the tradeoff in README)

## Session Continuity

Last session: 2026-03-21
Stopped at: Roadmap and STATE initialized; ready to plan Phase 1
Resume file: None
