# Project Research Summary

**Project:** Coordinate Routing Share Service
**Domain:** JSON document share-by-link service — static frontend + .NET API + MongoDB
**Researched:** 2026-03-21
**Confidence:** HIGH

---

## Executive Summary

This is a pastebin-style JSON sharing service scoped tightly to a small team. The existing `index.html` + `app.js` frontend is already partially wired for the backend — it has upload, replace, JWT token input, and API base-URL config. The entire gap is on the backend side plus a small frontend polish: surfacing the shareable URL after upload. The recommended approach is a two-service Docker Compose stack (.NET Minimal API + MongoDB), where .NET serves both the API and static files via `UseStaticFiles()`. This avoids a third nginx service without sacrificing correctness; CORS is handled with an env-var allowed-origins list. Auth is pre-generated JWT tokens shared via a secure channel — no login endpoint needed for a 2–5 person team.

The most important architectural decision is **random ID (not content hash) as the document key**. The research contains a direct contradiction on this point (STACK.md argues for SHA-256 content-hash; ARCHITECTURE.md argues for random ID). The random ID approach is correct for this project: the core requirement is replacing JSON behind a *stable* URL, and a content-derived hash changes whenever the payload changes, which breaks every existing shared link on update. Random IDs (8–16 hex chars from `RandomNumberGenerator`) keep the URL stable across replacements. The content-hash approach is appealing for deduplication but is incompatible with the replace-in-place requirement.

The primary risk is payload size: the existing `onUploadToApi` sends `state.cities` verbatim including `routeCache` arrays that can grow to several megabytes. Without a server-side size limit this will silently exhaust MongoDB Atlas's 512 MB free tier and hit MongoDB's 16 MB BSON document limit. A 5 MB request body cap enforced at the .NET layer (returning 413) must be in place before any production deployment. Secondary risks are standard for small free-tier apps: Docker secrets in git, JWT stored in localStorage, and cold-start hangs on the fetch call.

---

## Key Findings

### Recommended Stack

ASP.NET Core 8 (LTS) Minimal APIs are the right choice — they match the project's `.NET required` constraint, produce lean services without MVC boilerplate, and have first-class Docker + env-var configuration support. MongoDB 7 (Atlas M0 free tier for production, `mongo:7` Docker image for local dev) is the natural fit for opaque JSON document storage without schema migration overhead. The `MongoDB.Driver` 3.x NuGet package is required for .NET 8/9; version 2.x is legacy. JWT Bearer auth is built into the ASP.NET Core shared framework — no extra package install needed. Fly.io is the recommended free hosting target (persistent VMs; does not spin down idle). MongoDB Atlas M0 is the recommended free database host (512 MB, managed, no IP-whitelist issues).

**Core technologies:**
- **.NET 8 Minimal APIs:** HTTP API + static file serving — LTS until Nov 2026, no MVC overhead
- **MongoDB 7 / `MongoDB.Driver` 3.x:** Opaque JSON document store — schema-free, Atlas free tier covers expected volume
- **Docker Compose v2 (2-service):** `api` + `mongo` — `UseStaticFiles()` removes need for nginx container
- **JWT Bearer (built-in):** Auth for write endpoints — zero extra infrastructure, env-var secret
- **Fly.io + MongoDB Atlas M0:** Free hosting target — Fly.io persistent VMs avoid spin-down; Atlas handles database
- **`System.Security.Cryptography`:** Random ID generation via `RandomNumberGenerator.GetBytes(4–8)` — not content hash (see Contradictions)

### Expected Features

The frontend is already 80% wired. The backend is the entire gap. After upload, the frontend currently displays the raw `id` — a single small change to render the full shareable URL is the only frontend work in v1.

**Must have (table stakes / v1):**
- `POST /documents` (JWT required) — accept JSON payload, store it, return `{id, url}` — *core product*
- `GET /documents/{id}` (no auth) — return stored JSON publicly — *enables sharing*
- `PUT /documents/{id}` (JWT required) — replace payload, same URL — *enables update-in-place*
- Frontend shows full shareable URL + copy button after upload — *currently shows id only*
- Docker Compose full-stack local dev — *project constraint, gates all testing*

**Should have (differentiators / v1.x):**
- `viewer.html` — formatted read-only JSON viewer served from .NET at `/viewer/{id}` — dramatically better consumer experience than raw JSON
- Download button on viewer — trivial once viewer exists
- "Open in app" deep link (`?import={id}`) — small `app.js` addition to fetch JSON by ID on load

**Defer (v2+):**
- Deployment to free hosting (Fly.io) — defer until local flow is validated
- Per-user history, record management, expiry/TTL, versioning — explicitly out of scope

### Architecture Approach

Three logical layers: (1) static frontend (`index.html` / `app.js` / optional `viewer.html`) served by `app.UseStaticFiles()` from the .NET container's `wwwroot/`; (2) .NET Minimal API handling `POST`, `GET`, `PUT /documents`; (3) MongoDB document store. Docker Compose wires api + mongo as two services; only the API port is exposed to the host. No nginx container needed. JWT middleware guards write endpoints; GET is public. The document schema is content-opaque: payload stored as raw string, never parsed or validated by the backend.

**Major components:**
1. **`index.html` + `app.js`** — existing upload SPA; needs one change: render full URL after upload
2. **`.NET Minimal API` (`Program.cs` + `DocumentService`)** — JWT validation, random ID generation, MongoDB CRUD, static file serving
3. **`MongoDB`** — stores `{_id, createdAt, updatedAt, payload}` documents; named volume required from day one
4. **`viewer.html`** (v1.x) — new read-only viewer page; served by .NET `UseStaticFiles`; fetches GET endpoint
5. **Docker Compose** — two services: `api` (exposes port 5000) + `mongo` (internal only); `.env` for secrets

### Critical Pitfalls

1. **Payload size not limited** — `onUploadToApi` sends `routeCache` verbatim; enforce 5 MB request body cap at .NET layer (`MaxRequestBodySize`) and return 413 with a clear message. *Address in backend scaffold phase.*
2. **JWT in localStorage** — already in `app.js` line 5800; use pre-generated tokens stored in `sessionStorage` or an `httpOnly` cookie; at minimum document the risk and scope token lifetime to 24 hours. *Address during auth wiring.*
3. **Docker secrets in git** — commit `.env.example` with placeholders; add `.env` to `.gitignore` before writing a single credential; never default `JWT_SECRET` in `appsettings.json`. *Address in Docker scaffold phase.*
4. **Docker volume missing** — MongoDB data is lost on every `docker compose down` without a named volume; declare `mongo_data:/data/db` in Compose from day one. *Address in Docker scaffold phase.*
5. **No shareable URL in upload response** — backend must return `{id, url}` (not just `{id}`); frontend must render the full `${baseUrl}/viewer/${id}` URL with a copy button, or the core share flow is invisible. *Address in frontend polish phase.*

---

## Contradictions Resolved

### 1. URL Strategy: Content Hash vs. Random Stable ID — **RESOLVED: Random ID**

| Research File | Position |
|---------------|----------|
| STACK.md | SHA-256 of payload as `_id` — "same export → same URL" |
| ARCHITECTURE.md | Random 8-char hex ID — content hash breaks replace flow |

**Decision: Random ID.** The project explicitly requires replacing JSON behind a *stable* URL. A content-derived hash changes when the payload changes, which changes the URL — breaking every existing link on update. ARCHITECTURE.md's analysis is correct. Deduplication (same content = same URL) is a nice property but is incompatible with the replace requirement. Use `RandomNumberGenerator.GetBytes(8)` → lowercase hex string as the document `_id`.

### 2. Auth Model: Login Endpoint vs. Pre-Generated Token — **RESOLVED: Pre-generated token, no login endpoint**

| Research File | Position |
|---------------|----------|
| STACK.md | `POST /auth/token` endpoint with env-var credentials |
| ARCHITECTURE.md | Anti-pattern: building a login screen to issue JWTs; generate once via CLI/tool |

**Decision: No login endpoint.** The existing frontend already has a static JWT token field in `localStorage` — it is designed to accept a pre-generated token, not execute a login flow. For 2–5 team members, generating tokens once with a CLI script (`dotnet user-jwts` or an online JWT tool) and sharing via 1Password/Bitwarden is less surface area and fewer things to build. The `POST /auth/token` endpoint can be added in v2 if team grows or token rotation becomes painful.

### 3. Frontend Proxy Shape: .NET UseStaticFiles vs. nginx — **RESOLVED: UseStaticFiles, 2-service Compose**

| Research File | Position |
|---------------|----------|
| STACK.md | `app.UseStaticFiles()` + `MapFallbackToFile` in .NET; 2 services |
| ARCHITECTURE.md | nginx as third service; proxies `/api/*` to .NET container |

**Decision: `UseStaticFiles()` in .NET, 2-service Compose.** The nginx approach adds a third service, a config file, and a new debugging surface (nginx config errors + .NET errors). `UseStaticFiles()` is a one-liner in `Program.cs`, keeps the deployment surface minimal, and CORS can be handled cleanly with an env-var allowed-origins list. This is the correct path for a small internal tool. The nginx approach would be warranted if there were a dedicated frontend build pipeline (React/Vite) that produced a separate artifact — there isn't one here.

### 4. Deployment Target — **RESOLVED: Fly.io + MongoDB Atlas M0**

| Research File | Position |
|---------------|----------|
| STACK.md | Fly.io (always-free VMs) + Atlas M0 |
| PITFALLS.md | Warning: Fly.io free does NOT queue cold starts (Render does) |

**Decision: Fly.io + Atlas M0.** Despite the cold-start warning, Fly.io's free tier has always-on shared VMs that do not spin down after idle — this is the core advantage over Render (which spins down after 15 minutes). The cold-start problem noted in PITFALLS applies to a first-boot scenario, not regular idle use. Mitigate by adding an `AbortController` timeout (90s) on the fetch call and a "loading on first launch" message after 5 seconds. Atlas M0 is the correct managed database choice — no IP-whitelist issues with Fly.io if `0.0.0.0/0` is allowed.

---

## Implications for Roadmap

Based on research, suggested 4-phase structure:

### Phase 1: Foundation — Docker Scaffold + .NET Project + MongoDB
**Rationale:** Everything depends on a working local stack. The existing frontend already calls `POST /documents` — the backend must exist before any integration testing is possible. Secret hygiene must be established before writing any credential values.
**Delivers:** Running `docker compose up` starts api + mongo; .NET project scaffold with health check; `.env` / `.gitignore` / `.env.example` in place.
**Addresses:** Docker Compose local dev (P1 feature constraint)
**Avoids:** Docker secrets in git (Pitfall 4), missing named volume (Pitfall 9)
**Research flag:** Standard pattern — no additional research needed. `.NET new webapi --use-minimal-apis` + `mongo:7` Docker image is well-documented.

### Phase 2: Core API — Document Storage + Public Read + Authenticated Write
**Rationale:** The three endpoints (`POST`, `GET`, `PUT /documents`) are co-dependent and should be built together. Random ID generation and MongoDB document schema must be decided before writing the first line of storage code (schema version field, `uploadedBy`, size limit enforcement).
**Delivers:** All three API endpoints working; JWT middleware protecting writes; 5 MB request body limit; `{id, url}` returned on create/replace; Swagger UI in development.
**Addresses:** POST upload (P1), GET public view (P1), PUT replace (P1), content-hash strategy (resolved: random ID)
**Avoids:** Payload size not limited (Pitfall 3), any-user-can-replace-any-doc (Pitfall 2), hash/ID predictability (Pitfall 7), schema version drift (Pitfall 5)
**Research flag:** Standard .NET + MongoDB pattern — no additional research needed. ARCHITECTURE.md build order steps 1–3 are directly applicable.

### Phase 3: Frontend Integration + Upload UX Polish
**Rationale:** The API exists; now wire the frontend to it end-to-end and surface the shareable URL. This is the smallest phase — one change to `app.js`'s upload success handler.
**Delivers:** Upload success shows full clickable `${baseUrl}/viewer/${id}` URL with a copy button; replace confirmation modal; fetch timeout (90s AbortController); "first load may take a moment" message.
**Addresses:** Frontend URL display (P1), copy button (P1), clear error feedback (P1)
**Avoids:** No shareable URL in upload response (Pitfall — "looks done but isn't"), silent replace without confirmation (UX pitfall)
**Research flag:** No research needed — existing `app.js` patterns are well understood from codebase inspection.

### Phase 4: Viewer Page + Deployment Config
**Rationale:** The viewer depends on GET working (done in Phase 2). Deployment config depends on the full stack being validated locally (done in Phase 3). Both are v1.x features that can ship together.
**Delivers:** `viewer.html` served by .NET static files; formatted JSON display with schema version validation and graceful error state; download button; Fly.io `fly.toml` + Atlas M0 connection; CORS env-var for production origin.
**Addresses:** Formatted JSON viewer (P2), download button (P2), deployment to free hosting (P3)
**Avoids:** Viewer render crash on bad data (Pitfall 11), CORS misconfiguration in deployment (Pitfall 8), free hosting cold starts (Pitfall 6)
**Research flag:** Viewer HTML/JS implementation is straightforward vanilla JS. Fly.io deployment config is documented and low-risk. **Potential research needed:** Fly.io + MongoDB Atlas networking (IP whitelist approach for dynamic Fly.io egress IPs).

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** No point writing API code before the environment runs. Secret hygiene must be established first — retrofitting it after credentials have been typed in is error-prone.
- **Phase 2 before Phase 3:** Frontend integration requires a live API endpoint to call. Building both at once means debugging two unknowns simultaneously.
- **Phase 3 before Phase 4:** The viewer and deployment are lower priority (P2/P3). Validating the core upload → share → replace loop locally first reduces wasted effort if the core UX needs changes.
- **Viewer in Phase 4, not Phase 2:** The viewer is a consumer of the GET endpoint, not a dependency of it. The core team workflow (upload, get URL, replace) works without the viewer. The viewer improves the *recipient* experience — it's a differentiator, not table stakes.

### Research Flags

Phases needing deeper research during planning:
- **Phase 4 (Deployment):** Fly.io egress IP behavior with MongoDB Atlas IP allowlist — Atlas M0 free tier may require `0.0.0.0/0` (security tradeoff to document) or Atlas Data API as an alternative. Verify current Fly.io static egress IP availability.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Docker Compose + .NET scaffold — textbook setup, zero ambiguity
- **Phase 2:** .NET Minimal API + MongoDB.Driver 3.x CRUD — official docs are complete and current
- **Phase 3:** Vanilla JS `fetch()` + clipboard API — no research needed, existing code patterns apply

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official docs for .NET 8, MongoDB.Driver 3.x, Docker Compose v2; Atlas M0 pricing confirmed |
| Features | HIGH | Directly derived from codebase inspection (app.js + index.html); existing upload flow is concrete |
| Architecture | HIGH | Based on direct code inspection of app.js lines 5798–5850; standard .NET/MongoDB patterns |
| Pitfalls | HIGH | Grounded in confirmed codebase findings (localStorage JWT at line 5800, routeCache in payload at line 5863) + well-documented .NET/NoSQL deployment patterns |

**Overall confidence:** HIGH

### Gaps to Address

- **Atlas ↔ Fly.io networking:** Free tier Atlas may require `0.0.0.0/0` IP allowlist, which removes network-level protection. Decision: accept for v1 (small team tool, no PII) or use Atlas Data API for HTTP-based access. Flag for Phase 4 planning.
- **`routeCache` stripping:** Whether to strip `routeCache` from the uploaded payload should be decided in Phase 2. Stripping reduces document size (performance, storage) but means a document imported back into the app won't have cached routes. The viewer only needs display data — stripping is recommended. This is a product decision, not a technical gap.
- **Token distribution process:** With no login endpoint, the team needs a documented process for generating and sharing JWT tokens. A `dotnet user-jwts` or simple CLI script should be included in the project README. Low effort, easy to defer to Phase 2 end.
- **Replace authorization granularity:** Currently any valid JWT can replace any document. Adding an `uploadedBy` claim check is noted in Pitfall 2 but requires a decision: single-shared-token (simpler, accepts risk) vs. per-user tokens with ownership check (safer). For a 2–5 person team with a shared secret, single-token is acceptable for v1 — document the decision explicitly.

---

## Sources

### Primary (HIGH confidence)
- `app.js` direct codebase inspection (lines 5783–5863) — upload flow, JWT localStorage, routeCache in payload, schema version
- `index.html` direct codebase inspection (lines 415–420) — upload UI with API base URL and JWT token inputs
- ASP.NET Core Minimal APIs — https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis — stack decisions
- MongoDB .NET Driver v3 — https://www.mongodb.com/docs/drivers/csharp/current/ — driver version and patterns
- MongoDB Atlas Free Tier — https://www.mongodb.com/pricing — M0 512 MB, always-free
- Docker Compose v2 — https://docs.docker.com/compose/ — two-service architecture
- `mongo:7` Docker Hub — https://hub.docker.com/_/mongo — pinned image version
- `Microsoft.AspNetCore.Authentication.JwtBearer` — https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn

### Secondary (MEDIUM confidence)
- Fly.io Free Tier — https://fly.io/docs/about/pricing/ — persistent VMs; free tier terms can change
- Render.com free tier — container spin-down behavior, 15-min idle
- OWASP — localStorage JWT token XSS risk
- MongoDB 16 MB BSON document limit — official MongoDB documentation

### Tertiary (LOW confidence)
- Analog products (JSONBlob, Pastebin, Hastebin) — feature comparison from training data; behavior may differ from current product state

---

*Research completed: 2026-03-21*
*Ready for roadmap: yes*
