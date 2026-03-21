# Pitfalls Research

**Domain:** Route JSON sharing web app — public hash URLs, authenticated replace, NoSQL storage, Docker local dev, free hosting target
**Researched:** 2026-03-21
**Confidence:** HIGH (all findings grounded in existing codebase evidence + well-understood .NET/NoSQL/Docker deployment patterns)

---

## Critical Pitfalls

### Pitfall 1: JWT Token Stored in localStorage (Already In The Codebase)

**What goes wrong:**
`app.js` already persists `api_jwt_token` to `localStorage`. Any JavaScript running on the same origin — including third-party scripts, browser extensions injecting into the page, or XSS vectors — can read this token and impersonate an authenticated team member to replace documents.

**Why it happens:**
localStorage is the path of least resistance for persisting credentials across page loads in a vanilla JS app. The existing upload flow was likely prototyped quickly and localStorage was the obvious choice.

**How to avoid:**
Store the JWT in a `httpOnly` cookie set by the .NET backend after login, never in localStorage. If a cookie-based flow adds complexity, at minimum scope the token lifetime very short (15–30 minutes) and use a `sessionStorage` fallback that clears on tab close. Do not persist auth state in `localStorage` at all.

**Warning signs:**
- `localStorage.getItem("api_jwt_token")` exists in `app.js` (it already does — line 5800)
- Token survives browser restarts and tab closes
- No token expiry check before sending the `Authorization` header

**Phase to address:**
Authentication setup phase — before any production deployment; fix during backend auth wiring, not as an afterthought.

---

### Pitfall 2: Any Authenticated User Can Replace Any Document

**What goes wrong:**
The replace flow only checks "is this a logged-in team member?" not "does this team member own or have rights to this specific hash?" A single shared team login or any valid token can silently overwrite every document on the service.

**Why it happens:**
Small team mental model: "everyone we trust has the token." Works fine until someone replaces the wrong route by accident, or until the token leaks.

**How to avoid:**
Store `uploadedBy` (user identifier or a stable team role claim) on the document at upload time. On replace, either require the same identity or require an explicit admin scope in the JWT. Even a simple "team token + document creation timestamp as nonce" check beats nothing.

**Warning signs:**
- `PUT /documents/{hash}` endpoint accepts any valid Bearer token without checking document metadata
- No `uploadedBy` field in the stored document schema
- Replace success is silent — no audit trail

**Phase to address:**
Backend API design phase — define the document schema with ownership fields before writing the replace endpoint.

---

### Pitfall 3: No Request Payload Size Limit → Free Tier Abuse / Storage Explosion

**What goes wrong:**
`state.cities` in the export payload includes `routeCache` arrays (already visible in `app.js` line 5863 — `city.routeCache`). A fully-loaded session with many cities, schools, and cached route pairs can easily produce multi-megabyte JSON. Without limits: free tier MongoDB Atlas 512 MB fills up, free hosting ingress bandwidth is consumed, and a single bad upload can exceed MongoDB's 16 MB BSON document limit and return an opaque 500 error.

**Why it happens:**
Route cache data grows silently. The exporter includes it without trimming because it's needed for session restore. Nobody thinks to check sizes until an upload fails in production.

**How to avoid:**
- Enforce a hard limit at the .NET API layer (e.g., 5 MB max body size) and return a descriptive 413 response.
- Consider stripping `routeCache` from the shareable upload payload since viewers only need to display data, not recalculate routes.
- Log document sizes at upload time even in dev so trends are visible.

**Warning signs:**
- `onUploadToApi` sends `state.cities` verbatim including `routeCache` (confirmed in `app.js` line 5817)
- No `[RequestSizeLimit]` attribute or `MaxRequestBodySize` configuration in the .NET backend
- MongoDB 16 MB document limit is not mentioned anywhere in the project

**Phase to address:**
Backend API design phase — set size limits before writing the storage layer.

---

### Pitfall 4: Docker Compose Secrets Committed to Git

**What goes wrong:**
JWT signing keys, MongoDB connection strings with credentials, and any API keys end up hardcoded in `docker-compose.yml` or `.env` files that get committed. Once in git history, rotating secrets is insufficient — the history must be purged.

**Why it happens:**
`docker-compose.yml` is the obvious place to set environment variables for local dev, and `.gitignore` for `.env` is easy to forget when scaffolding quickly.

**How to avoid:**
- Ship a `docker-compose.yml` that reads from environment variables or a `.env` file
- Ship a `.env.example` with placeholder values
- Add `.env` to `.gitignore` before writing a single secret
- Never default `JWT_SECRET` to a hardcoded string in code — fail fast if the env var is missing

**Warning signs:**
- `docker-compose.yml` contains literal password strings
- `.env` is not in `.gitignore`
- `JWT_SECRET` has a fallback value in appsettings.json

**Phase to address:**
Docker local dev phase — establish secret hygiene before writing any credential values.

---

### Pitfall 5: Schema Version Drift Makes Old Documents Unviewable

**What goes wrong:**
The app already exports `schemaVersion: 5` (confirmed `SCHEMA_VERSION = 5` in `app.js` line 4). Documents uploaded at version 5 are stored in MongoDB. When the app evolves to version 6 and the viewer tries to render a version-5 document, fields are missing or renamed and the viewer either crashes or shows blank data.

**Why it happens:**
NoSQL gives you schema freedom which feels great until you need to read old data. Migration is deferred ("we'll handle it later") and later never comes until a user complains their shared link is broken.

**How to avoid:**
- Store `schemaVersion` inside the persisted document (already present in the payload — `state.schemaVersion`)
- Write a `normalizeDocument(doc)` function in the viewer that handles version upgrades, mirroring the existing `normalizeState()` in `app.js`
- Treat each schema version bump as a deliberate decision that requires a migration path

**Warning signs:**
- `schemaVersion` is stored but never read by the viewer/API
- No `normalizeState`-equivalent on the read path
- Version is bumped in `app.js` without updating any migration logic

**Phase to address:**
Document storage phase — define schema versioning policy before the first document is written to MongoDB.

---

### Pitfall 6: Free Hosting Cold Starts Break the Upload Flow Silently

**What goes wrong:**
Free tier hosting on Render, Railway, or Fly.io free plan spins down idle containers after 15 minutes. When a team member uploads a document, the first request hits a cold start (30–60 seconds). The existing `onUploadToApi` has no timeout handling — `fetch()` will hang, the "Uploading…" status will show indefinitely, and the user will assume the service is broken.

**Why it happens:**
Cold starts are invisible during local Docker testing (no spin-down). The problem only surfaces in the free-hosted environment.

**How to avoid:**
- Add an explicit `AbortController` timeout (e.g., 90 seconds) to the `fetch` call in `onUploadToApi`
- Show a "this may take a moment on first load" message after 5 seconds
- Consider a health-check ping endpoint the frontend can hit before attempting upload
- Choose hosting with at minimum a "wake on request" that queues rather than drops the first request (Render free tier queues; Fly.io free does not)

**Warning signs:**
- `fetch()` in `onUploadToApi` has no timeout (confirmed — no `signal` parameter in current code)
- No loading state beyond the button disable
- No retry logic

**Phase to address:**
Deployment target selection phase and frontend upload UX polish phase.

---

## Moderate Pitfalls

### Pitfall 7: Hash/ID Predictability — Documents Are Enumerable

**What goes wrong:**
If document IDs are sequential integers or short hashes, anyone can iterate `GET /documents/1`, `/2`, `/3` and retrieve all stored route data. This defeats the "security by obscurity" model that hash URLs depend on.

**Why it happens:**
MongoDB ObjectId is used without thought, or a sequential counter is used for simplicity. ObjectId is actually time-ordered and partially guessable.

**How to avoid:**
Generate document IDs using `Guid.NewGuid()` (UUID v4) or a CUID library. Do not expose MongoDB's `_id` directly — map it to a stable random slug. 128-bit random IDs are not brute-forceable at any realistic scale.

**Warning signs:**
- Document IDs in share URLs look like `507f1f77bcf86cd799439011` (MongoDB ObjectId — guessable by time prefix)
- `GET /documents/{id}` returns 200 for sequential numeric IDs

**Phase to address:**
Backend API design phase — define ID generation strategy before writing the storage layer.

---

### Pitfall 8: CORS Misconfiguration Between Local Docker and Deployed Origin

**What goes wrong:**
During Docker local dev, the frontend is served from `localhost:some-port` and the API is at `localhost:another-port`. In deployment, origins change. If CORS is configured as `AllowAnyOrigin` for "convenience" locally and then tightened later, uploaded from the deployed frontend start failing with opaque CORS errors.

**Why it happens:**
CORS is "fixed" locally with a broad policy, committed, and forgotten. Nobody tightens it before deployment.

**How to avoid:**
- Configure CORS allowed origins from an environment variable: `ALLOWED_ORIGINS=http://localhost:5173,https://myapp.onrender.com`
- Never use `AllowAnyOrigin` in production configuration
- Test CORS policy as part of the Docker Compose local stack, not just browser-dev-server

**Warning signs:**
- `builder.Services.AddCors(o => o.AddPolicy("...", p => p.AllowAnyOrigin()))` in Program.cs
- ALLOWED_ORIGINS not in `.env.example`

**Phase to address:**
Backend API design phase and deployment phase.

---

### Pitfall 9: Docker Volume Not Declared → Data Lost on Container Restart

**What goes wrong:**
MongoDB (or any NoSQL container) stores data inside the container by default. `docker compose down` or `docker compose up --build` destroys all documents. During local testing of the full share flow, the team loses test data constantly and can't verify that hash URLs stay stable.

**Why it happens:**
Docker Compose quick-start examples rarely show volume declarations. The service starts and works, volumes are added "later."

**How to avoid:**
Declare a named volume for MongoDB data in `docker-compose.yml` from day one:
```yaml
volumes:
  mongo-data:
services:
  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
```

**Warning signs:**
- MongoDB service in `docker-compose.yml` has no `volumes:` declaration
- `docker compose down` followed by `docker compose up` produces a fresh empty database

**Phase to address:**
Docker local dev phase — include named volumes in the initial Compose scaffold.

---

### Pitfall 10: No Document TTL / Storage Fills Up Silently

**What goes wrong:**
Every upload creates a new document. The free MongoDB Atlas tier has a 512 MB storage limit. Small teams uploading frequently (exporting routes daily) will hit this limit within months. There is no cleanup mechanism.

**Why it happens:**
"We'll add cleanup later" is the default. Free tier limits are abstract until they're real.

**How to avoid:**
- Set a MongoDB TTL index on a `createdAt` field (e.g., 90-day auto-expiry) from the start, or
- Implement document count-based eviction: store a max of N documents per team/token, drop oldest on overflow
- Monitor Atlas storage in the free dashboard before it becomes a problem

**Warning signs:**
- No `createdAt` field in the document schema
- No TTL index in the MongoDB setup scripts
- No mention of storage limits in the deployment checklist

**Phase to address:**
Document storage design phase.

---

### Pitfall 11: Viewer Doesn't Validate Stored JSON Structure Before Rendering

**What goes wrong:**
The viewer page receives a stored document and tries to render it. If the document is malformed, partially uploaded, or from an incompatible schema version, the render code throws a JavaScript exception and the page shows a blank screen with no error message. The user assumes the link is broken.

**Why it happens:**
Happy-path development — the viewer is written assuming well-formed documents because that's what gets stored during testing.

**How to avoid:**
- Validate the fetched document against expected schema fields before attempting to render
- Show a clear "This document cannot be displayed" message with the schema version when validation fails
- Log validation failures server-side so the team can investigate

**Warning signs:**
- Viewer renders by direct property access without null-checks (e.g., `doc.cities.map(...)` without checking `doc.cities` exists)
- No error boundary around the render path

**Phase to address:**
Viewer frontend phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode JWT secret in appsettings.json | Quick local dev start | Secret in git, rotation requires redeploy | Never — use env vars from day one |
| `AllowAnyOrigin` CORS policy | No CORS debugging during dev | Security hole in production | Never in production config |
| Store full `routeCache` in uploaded document | Complete session restore from share URL | Large documents, slow loads, storage costs | Only if viewers explicitly need offline route calculation |
| Skip named Docker volumes | Simpler initial Compose file | Data loss on every restart | Never — add volumes at scaffold time |
| Sequential/ObjectId document IDs in share URL | No extra ID generation code | Documents are enumerable | Never for public share URLs |
| Single shared JWT token for all team members | No auth UI to build | Can't audit who replaced what, token rotation affects everyone | MVP only if team is 1–2 people and you accept the risk |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| MongoDB .NET driver + Docker | Using `localhost` as connection host inside backend container | Use Docker Compose service name: `mongodb://mongo:27017` |
| MongoDB Atlas free tier | Forgetting to whitelist the hosting provider's outbound IPs | Add `0.0.0.0/0` for Render/Railway (dynamic IPs), or use Atlas Data API |
| .NET on free hosting (Render) | Default Dockerfile uses `aspnet:8.0` which is large, slow to pull | Use `aspnet:8.0-alpine` to cut cold start time |
| JWT validation in .NET | `ValidateLifetime: false` left over from dev | Always enable lifetime validation in production middleware |
| Fetch from vanilla JS frontend | No `Content-Type: application/json` header on POST | Explicitly set header — already correct in existing `onUploadToApi` |
| MongoDB 16 MB document limit | Large `routeCache` arrays hit the limit with no warning until a 500 error | Validate document size before insert; return 413 from API if over limit |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Storing full `routeCache` in shared document | Share URL load is slow (5–15s for large route sets) | Strip `routeCache` from the upload payload; viewer only needs display data | Any document with 50+ route pairs |
| No index on document hash ID field | Viewer lookup is a full collection scan | Index the `id` / hash field on the MongoDB collection from day one | > 1,000 documents (noticeable on free tier hardware) |
| Returning full document on replace confirmation | Unnecessary large payload on `PUT` response | Return only `{ id, updatedAt }` on successful replace | Any document over 1 MB |
| No response streaming on viewer fetch | Browser waits for entire document before starting render | Not required at MVP scale for small team | Documents over 2 MB |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| JWT token in localStorage (already in codebase) | XSS reads token, impersonates team member, replaces any document | Move to httpOnly cookie set by backend login endpoint |
| No rate limiting on `POST /documents` | Automated upload flood exhausts free tier storage and bandwidth quota | Add IP-based rate limiting via ASP.NET Core rate limiter middleware (built-in since .NET 7) |
| Serving raw stored JSON directly without sanitization | Stored XSS if viewer renders any string field as HTML | Always render data as text content, never `innerHTML` |
| Hash URL treated as authentication | "Only people with the link can access it" is not a security guarantee | Document clearly that hash URLs are shareable and not private; don't put sensitive PII in route data |
| MongoDB connection string with admin credentials | Full database access if leaked | Create a dedicated MongoDB user with read/write on the single collection only — not admin |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Upload shows ID but not the full shareable URL | User must manually construct the URL; often gets it wrong | After upload, display the complete `https://yourapp.com/view/{id}` URL with a copy button |
| "Uploading…" spinner hangs forever on cold start | User retries, creates duplicate documents, gets confused | Show a secondary message after 5s: "First load may take up to 60s on free hosting" |
| No confirmation before replace | Accidental overwrites with no recovery | Show a modal: "This will replace the current document at this URL. Continue?" |
| Import JSON and Upload to API look identical to users | User uploads to API thinking it's a local import, or vice versa | Visually separate the two flows; label "Upload to API" as "Publish & Share" |
| Share URL only shown once after upload | User navigates away before copying | Persist the last uploaded document ID in sessionStorage so it can be recovered within the session |

---

## "Looks Done But Isn't" Checklist

- [ ] **Hash URL shareable link:** Upload shows an ID, but the full clickable viewer URL is not constructed or displayed — verify that the frontend shows a complete URL after upload
- [ ] **Authenticated replace:** A `PUT /documents/{id}` endpoint exists, but test that a request with a *different* valid JWT cannot replace a document it didn't create
- [ ] **Docker full stack:** `docker compose up` starts all services, but test that the frontend → API → MongoDB → viewer round trip works end-to-end, including a browser pointed at the frontend container
- [ ] **NoSQL persistence:** The MongoDB container is running, but verify that documents survive `docker compose down && docker compose up` (named volume required)
- [ ] **Public read, no auth:** The viewer URL works in an incognito window with no token — verify no auth middleware blocks the `GET /documents/{id}` route
- [ ] **JWT token expiry:** The upload flow works with a fresh token — verify the error message is clear and actionable when the token has expired
- [ ] **CORS in deployment:** Works locally — verify CORS policy is not `AllowAnyOrigin` and the deployed frontend origin is explicitly allowed

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| JWT secret committed to git | HIGH | Rotate secret, force all tokens to re-issue, purge git history with `git filter-repo`, audit for other leaked secrets |
| MongoDB data lost (no volume) | LOW if dev only | Re-upload test documents; add named volume before proceeding |
| Documents unviewable after schema bump | MEDIUM | Write a migration script that reads all documents, applies `normalizeState()` equivalent, writes back; run once |
| Free tier storage exhausted | MEDIUM | Export Atlas data, upgrade tier or purge old documents manually, add TTL index going forward |
| `AllowAnyOrigin` in production | LOW | Update CORS config, redeploy — no data loss |
| Payload too large hitting MongoDB 16 MB limit | MEDIUM | Strip `routeCache` from upload payload retroactively if already storing it, update API validator |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| JWT in localStorage | Backend auth setup phase | Confirm no `localStorage.setItem("api_jwt_token")` in shipped code |
| Any user can replace any doc | Backend API design phase | Write a test: valid token for user B cannot replace doc uploaded by user A |
| No payload size limit | Backend API design phase | POST a 10 MB payload; confirm 413 response |
| Docker secrets in git | Docker local dev phase | `git grep -r "password\|secret\|jwt"` returns no hardcoded values |
| Schema version drift | Document storage design phase | Store a v5 document, bump `SCHEMA_VERSION`, confirm viewer still renders it |
| Free hosting cold starts | Deployment phase | Simulate cold start; confirm upload shows progress message and doesn't hang |
| Hash/ID predictability | Backend API design phase | Confirm document IDs are UUID/CUID; sequential scan of `/documents/1..100` returns 404 |
| CORS misconfiguration | Backend API + deployment phase | Test from deployed frontend origin in browser devtools; no CORS errors |
| Docker volume not declared | Docker local dev phase | `docker compose down && docker compose up`; documents still exist |
| No TTL / storage cleanup | Document storage design phase | TTL index present in MongoDB setup; verify with `db.collection.getIndexes()` |
| Viewer render crash on bad data | Viewer frontend phase | Feed malformed JSON to viewer; confirm graceful error message |
| Missing shareable URL display | Frontend upload UX phase | After upload, a complete clickable URL is visible without manual construction |

---

## Sources

- Existing `app.js` codebase analysis (confirmed localStorage JWT pattern, routeCache in payload, missing timeout on fetch)
- MongoDB documentation: 16 MB BSON document limit, TTL indexes, Atlas free tier 512 MB storage limit
- ASP.NET Core documentation: built-in rate limiter (System.Threading.RateLimiting, .NET 7+), CORS middleware, request size limits
- Render.com free tier documentation: container spin-down after 15 min inactivity, ~30–60s cold start
- OWASP: localStorage token storage risks (XSS attack surface)
- Docker Compose named volumes documentation

---
*Pitfalls research for: Route JSON sharing web app (coordinate-routing)*
*Researched: 2026-03-21*
