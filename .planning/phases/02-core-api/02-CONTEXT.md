# Phase 2: Core API - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the three document endpoints — `POST /documents`, `GET /documents/{id}`, `PUT /documents/{id}` — with shared bearer token authentication, a 5 MB upload limit, and opaque UUID-based share IDs. This phase delivers the backend API that the existing frontend already expects to call. It does not modify the frontend, build the viewer page, or handle deployment.

</domain>

<decisions>
## Implementation Decisions

### Upload response & share URL format
- Document IDs are UUIDs (e.g., `550e8400-e29b-41d4-a716-446655440000`), generated server-side on POST
- POST `/documents` returns `{"id": "...", "url": "https://host/documents/...", "createdAt": "..."}`
- The full URL is built dynamically from the request's `Host` header (scheme + host + path)
- No additional env var needed for base URL — the API reads the incoming request context

### Replace behavior
- PUT `/documents/{id}` performs a full overwrite of the stored JSON payload — no merge
- No ownership tracking — anyone with the shared bearer token can replace any document
- PUT returns the same response shape as POST: `{"id": "...", "url": "...", "createdAt": "..."}`
- Documents track `createdAt` and `updatedAt` separately — PUT updates `updatedAt` only, `createdAt` reflects original upload time

### Claude's Discretion
- Token validation approach (simple string match of bearer token against `Auth:JwtSecret` env var, or JWT signature verification)
- Error response format for 401, 404, 413 (JSON or plain text)
- MongoDB collection name and document schema design
- Whether to add an `updatedAt` field to the POST response or only on PUT responses
- Internal middleware ordering and request pipeline structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — Product direction, hard constraints, key decisions (random opaque ID, preserve routeCache, shared token auth)
- `.planning/REQUIREMENTS.md` — Phase 2 requirements: AUTH-01, AUTH-02, DOC-01–DOC-06, SHARE-03
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, dependency on Phase 1
- `.planning/STATE.md` — Current decisions and progress

### Research
- `.planning/research/SUMMARY.md` — Stack recommendations, resolved contradictions (random ID vs content hash, shared token vs login)

### Phase 1 foundation
- `.planning/phases/01-foundation/01-CONTEXT.md` — Locked decisions for Docker, env vars, project structure
- `backend/ShareService.Api/Program.cs` — Current API scaffold with fail-fast config, CORS, MongoDB wiring, `/health` endpoint

### Frontend contract
- `app.js` lines 5798–5850 — `onUploadToApi()` function: POSTs `{schemaVersion, selectedCityId, cities}` to `${baseUrl}/documents` with `Bearer ${token}` header; reads `data.id` from response

No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Program.cs` already has fail-fast `Require()` for config, MongoDB `IMongoClient` + `IMongoDatabase` singletons, CORS policy, and `UseStaticFiles()` — new endpoints build directly on this
- `Auth:JwtSecret` is already loaded and available at startup — ready for bearer token validation middleware or filter

### Established Patterns
- Minimal API style (`app.MapGet/MapPost`) — no controllers
- Environment variables via `__` separator (translated to `:` by ASP.NET config provider)
- Single `Program.cs` file — keep endpoints here or extract to extension methods as complexity grows
- xUnit + Mongo2Go + WebApplicationFactory for integration tests

### Integration Points
- `app.MapPost("/documents", ...)` — new endpoint wired directly into the existing `Program.cs`
- `app.MapGet("/documents/{id}", ...)` — public read, no auth check
- `app.MapPut("/documents/{id}", ...)` — authenticated replace
- `IMongoDatabase` from DI — used to access the documents collection
- Frontend expects `data.id` from POST response at `app.js` line 5836

</code_context>

<specifics>
## Specific Ideas

- The frontend already reads `data.id || data._id` from the POST response — return `id` as the primary field
- Cities array within the uploaded JSON includes `routeCache` per city — store the entire payload as-is without stripping or transforming any fields
- The share URL in the response should be a full absolute URL (e.g., `http://localhost:5000/documents/550e8400-...`) so it's directly copyable

</specifics>

<deferred>
## Deferred Ideas

- Frontend UI changes for displaying share URL / copy button — Phase 3
- Formatted viewer page for shared documents — Phase 3
- Deployment configuration and hosting — Phase 4

</deferred>

---

*Phase: 02-core-api*
*Context gathered: 2026-03-21*
