# Roadmap: Coordinate Routing Share Service

## Overview

Four phases take the existing `index.html` export flow to a fully shareable, team-writable service. Phase 1 establishes a runnable local stack with correct secret hygiene before any feature code is written. Phase 2 builds all three API endpoints (upload, read, replace) with JWT-guarded write access while preserving full exported JSON including `routeCache`. Phase 3 wires the frontend to surface the shareable URL and delivers the formatted viewer page. Phase 4 ships deployment-ready configuration for Fly.io + MongoDB Atlas so the team can go live on free hosting with documented steps.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Docker + .NET scaffold with secret hygiene and MongoDB volume in place
- [ ] **Phase 2: Core API** - Upload, public read, and replace endpoints live behind JWT-guarded write auth
- [ ] **Phase 3: Frontend + Viewer** - Shareable URL displayed after upload; formatted viewer page for recipients
- [ ] **Phase 4: Deployment** - Fly.io + Atlas deployment config and documentation ready to use

## Phase Details

### Phase 1: Foundation
**Goal**: The full local environment runs reliably and securely before any feature code is written
**Depends on**: Nothing (first phase)
**Requirements**: OPS-01, OPS-02, OPS-03
**Success Criteria** (what must be TRUE):
  1. `docker compose up` starts both the .NET API and MongoDB services without errors
  2. API responds to a health-check endpoint (GET /health returns 200) confirming the stack is wired
  3. `.env` holds all secrets; `.env.example` contains only placeholders; `.env` is in `.gitignore`
  4. MongoDB data survives `docker compose down` + `docker compose up` via a named volume
  5. API reads allowed origins and JWT secret from environment variables — nothing is hardcoded
**Plans**: 2 plans

Plans:
- [ ] `01-01-PLAN.md` — Scaffold the .NET API, fail-fast environment contract, and health/config tests
- [ ] `01-02-PLAN.md` — Add Compose startup, Mongo persistence, and local operator documentation

### Phase 2: Core API
**Goal**: Team members can upload, publicly share, and replace route documents through the API
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, SHARE-03
**Success Criteria** (what must be TRUE):
  1. `POST /documents` with a valid bearer token stores the full exported document including `routeCache` and returns `{id, url}` with a stable opaque ID
  2. `GET /documents/{id}` returns the stored JSON to anyone without authentication
  3. `PUT /documents/{id}` with a valid bearer token replaces the payload; the share URL is unchanged
  4. `POST` or `PUT` with a missing or invalid token returns 401; `GET` requires no token
  5. `POST` or `PUT` with a payload exceeding 5 MB returns 413 with a clear error message
**Plans**: 1 plan

Plans:
- [ ] `02-01-PLAN.md` — TDD: Integration tests + POST/GET/PUT endpoints with auth and body limit

### Phase 3: Frontend + Viewer
**Goal**: Anyone with a share URL can view a formatted page; uploaders see a ready-to-share link immediately
**Depends on**: Phase 2
**Requirements**: SHARE-01, SHARE-02, VIEW-01, VIEW-02, VIEW-03
**Success Criteria** (what must be TRUE):
  1. After a successful upload the existing frontend displays the full shareable URL as a clickable link
  2. A single button click copies the shareable URL to the clipboard
  3. Opening `/viewer/{id}` in a browser renders the route document in a formatted, human-readable layout (not raw JSON)
  4. Opening `/viewer/{id}` for a missing or unsupported document shows a clear error state (not a blank page or crash)
  5. The viewer page provides a Download button that saves the raw JSON file to disk
**Plans**: 2 plans

Plans:
- [ ] `03-01-PLAN.md` — Backend viewer route, API URL update to /viewer/{id}, integration tests
- [ ] `03-02-PLAN.md` — Frontend share URL display + copy button, full viewer page with rendering/errors/download

### Phase 03.1: Editable Sharing (INSERTED)

**Goal:** Shared link loads document data into the full scheduler app for editing; users can save changes back to the server
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05
**Depends on:** Phase 3
**Plans:** 2/3 plans executed

Plans:
- [ ] `03.1-01-PLAN.md` — Backend /edit/{id} route (TDD), wwwroot index.html stub, Dockerfile frontend asset copy
- [ ] `03.1-02-PLAN.md` — Frontend EDIT_MODE detection, document auto-load, API URL pre-fill, PUT save-back with confirmation
- [ ] `03.1-03-PLAN.md` — Human verification checkpoint: end-to-end editable sharing flow

### Phase 4: Deployment
**Goal**: The team can deploy the service to Fly.io + MongoDB Atlas using documented steps with no manual config guesswork
**Depends on**: Phase 3
**Requirements**: OPS-04, OPS-05
**Success Criteria** (what must be TRUE):
  1. Project contains a `fly.toml` (or equivalent) that deploys the .NET API container to Fly.io after setting secrets — no manual edits required beyond secret values
  2. README documents exactly how to generate a JWT token, configure the Atlas connection string, and run `fly deploy` end-to-end
  3. Production CORS configuration points to the Fly.io domain via an environment variable set at deploy time
**Plans**: 1 plan

Plans:
- [ ] `04-01-PLAN.md` — Fly deployment manifest, verification script, and zero-to-deploy README runbook

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-03-21 |
| 2. Core API | 1/1 | Complete | 2026-03-21 |
| 3. Frontend + Viewer | 2/2 | Complete | 2026-03-21 |
| 4. Deployment | 0/TBD | Not started | - |
