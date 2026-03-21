# Coordinate Routing Share Service

## What This Is

This project turns the existing `index.html` export flow into a shareable web app for a small team. Users can export route data as JSON, upload it to a .NET backend, and get a stable hash-based URL that anyone with the link can open to view the stored data.

## Core Value

Make route export data easy to publish and share without passing JSON files around manually.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] A user can upload exported JSON from the existing frontend to a .NET backend.
- [ ] A user can receive and reuse a stable hash URL for a stored JSON document.
- [ ] Anyone with the hash URL can view the stored JSON without authentication.
- [ ] A logged-in team member can replace the JSON stored behind an existing hash URL.
- [ ] The full stack can be started and tested locally with Docker.
- [ ] The project includes a recommended free hosting target for later deployment.

### Out of Scope

- Private viewer access controls — hash URLs are intentionally shareable between users.
- Per-user history dashboards — not required for the first release flow.
- Rich record management features like edit forms or delete UX — the current goal is upload, share, and replace.

## Context

The current codebase already has a frontend in `index.html` that exports JSON when the user clicks an Export button. The next step is to keep that frontend as the base, add an upload path to a new backend, and persist exported JSON in a NoSQL database. The product is meant for a small team that wants to share route data more easily instead of sending files around manually.

The initial delivery should work locally through Docker so the team can test the complete flow before deployment. The deployment target will be chosen later, but the project should be shaped so it can run on a free hosting option.

## Constraints

- **Frontend**: Use the existing `index.html` flow as the starting point — preserve the current export experience where possible.
- **Backend**: Use .NET for the server — required by project direction.
- **Database**: Use a NoSQL database — JSON payloads should be stored without forcing a relational model first.
- **Local Dev**: Must be testable via Docker — the full stack should be runnable locally in a repeatable way.
- **Access Model**: Public read by hash, authenticated write for replacement — sharing must stay simple while updates remain restricted.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep `index.html` as the frontend base | The existing export flow already works and should be extended instead of replaced by default | — Pending |
| Use stable hash URLs for shared data | The main user value is shareable access without moving files around | — Pending |
| Allow public viewing but require login for replacement | Shared links should be frictionless, but overwriting shared data needs team-level control | — Pending |
| Run locally with Docker from the start | The team needs an easy way to test the full stack before deployment | — Pending |

---
*Last updated: 2026-03-21 after initialization*
