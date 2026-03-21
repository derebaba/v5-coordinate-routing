# Feature Research

**Domain:** Route JSON share-by-link publishing tool (small team, internal)
**Researched:** 2026-03-21
**Confidence:** HIGH — scope is narrow and well-defined; existing frontend constrains the problem space tightly

---

## Context: What Already Exists

The frontend (`index.html` + `app.js`) is **already partially wired**:

| Already built | State |
|---------------|-------|
| Export JSON to file (download) | ✅ Done |
| Upload JSON to backend via POST `/documents` with Bearer JWT | ✅ Done |
| Upload status display (shows returned `id` on success) | ✅ Partial — shows ID, not a URL |
| API base URL field (persisted in `localStorage`) | ✅ Done |
| JWT token field (persisted in `localStorage`) | ✅ Done |
| Import JSON from file (re-load into app state) | ✅ Done |

The gap is entirely on the **backend side** and in surfacing the shareable **URL** (not just the raw ID) in the frontend after upload.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Upload JSON → receive stable shareable URL | Core product promise; without this nothing else matters | LOW | Frontend POST to `/documents` exists; backend must return `{id, url}` |
| View stored document at public URL (no auth required) | Anyone with the link must be able to open it — frictionless sharing is the whole point | LOW | GET `/documents/{hash}` with no auth guard |
| Authenticated write (JWT bearer token) | Prevents public writes; team-only upload/replace | LOW | Authorization middleware on POST and PUT; frontend JWT input already exists |
| Replace existing document behind the same URL | Teams iterate on route data; the link must stay stable across updates | LOW | PUT `/documents/{hash}` with JWT; hash derived from content or fixed at first upload |
| Display shareable link in frontend after successful upload | Without seeing the URL, users can't share it — defeats the purpose | LOW | Frontend already shows `id`; needs to render `${baseUrl}/documents/${id}` or backend-returned URL |
| Copy link to clipboard from upload success state | Standard UX expectation after any share-link flow | LOW | One button, `navigator.clipboard.writeText()` |
| Clear error feedback on upload failure | Users need to know if upload failed and why | LOW | Frontend already handles status text; backend must return meaningful error shapes |
| Serve raw JSON at the public URL | Consumers (scripts, other tools) may need to fetch the JSON directly | LOW | `Content-Type: application/json` response on GET |
| Full stack runnable locally via Docker | Team must be able to test before deployment | MEDIUM | docker-compose with .NET API + MongoDB/equivalent |

### Differentiators (Competitive Advantage)

Features that set the product apart from "just upload a file somewhere."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Content-hash stable URL | Same JSON payload → same hash → same URL; natural dedup; re-uploading unchanged data is idempotent | MEDIUM | SHA-256 of normalized payload as the document key; store only once if hash matches |
| Formatted JSON viewer at the share URL | Viewing raw JSON in a browser is hostile; a rendered viewer (collapsible, syntax-highlighted) dramatically improves the consumer experience | MEDIUM | Static HTML viewer page served from the backend or a thin viewer route; `json-viewer` web component or similar |
| Download button on viewer page | Allows recipients to pull the file without navigating the main app | LOW | Anchor tag with `Content-Disposition: attachment` |
| "Open in app" link on viewer page | Lets a recipient load the shared JSON back into the main scheduling tool in one click | LOW | Links to `index.html?import={hash}` or equivalent; app already has import logic |
| Session-persisted API config (already exists) | Reduces friction for team members who upload repeatedly — no re-entering credentials | LOW (done) | Already implemented in frontend; backend just needs to be consistent with field expectations |

### Anti-Features (Deliberately NOT Building)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Per-user history dashboard / "my uploads" list | Seems natural to track what you've shared | Requires user identity, sessions, and a management UI — significant scope for a share-by-link tool | Use the stable hash URL as your record; bookmark it |
| Rich record management (edit forms, rename, delete UI) | Users instinctively want to manage their data | Adds auth-per-document, ownership model, and CRUD UI; out of scope per PROJECT.md | Replace the JSON content via PUT; the URL stays the same |
| Private/access-controlled documents | "What if we don't want everyone to see it?" | Hash URL IS the access control — only people with the link can find it; adding ACLs means user accounts | Keep hash URLs as-is; they're obscure by design |
| Expiry / TTL on documents | "What if old data sits there forever?" | Complicates storage and breaks stable-link promise | Accept permanent storage for now; a small team won't generate significant volume |
| Real-time collaboration / live updates | "Can we see changes as they're made?" | Requires WebSockets, conflict resolution, and operational transform — completely out of scope | Re-upload and share the new URL/replace in-place |
| Multiple authentication schemes (OAuth, API keys, magic links) | "JWT is awkward to set up" | Each scheme is a new integration surface; JWT is already wired in the frontend | Document the JWT flow clearly; the friction is acceptable for a small team |
| Search or filtering across stored documents | Seems useful when you have many documents | Requires indexing, query UI, and document metadata — unnecessary at small scale | Hash URL lookup is sufficient; no browse/search needed |
| Versioning / history of replacements | "Can we roll back to an earlier version?" | Version history requires a diff model, storage growth policy, and version-picker UI | Keep it simple: latest upload wins; download before replacing if needed |

---

## Feature Dependencies

```
[Content-hash stable URL]
    └──requires──> [Store JSON with SHA-256 key]
                       └──requires──> [NoSQL document store (MongoDB)]

[View document at public URL]
    └──requires──> [Store JSON with stable hash key]

[Replace document via PUT]
    └──requires──> [View document at public URL]
    └──requires──> [JWT authentication middleware]

[Formatted JSON viewer page]
    └──requires──> [View document at public URL]
    └──requires──> [Serve HTML at viewer route]

[Download button on viewer page]
    └──requires──> [Formatted JSON viewer page]

["Open in app" link on viewer page]
    └──requires──> [Formatted JSON viewer page]
    └──requires──> [Frontend import-by-URL capability (new frontend work)]

[Copy link in frontend after upload]
    └──requires──> [Backend returns shareable URL in POST response]

[Docker local dev]
    └──requires──> [.NET API Dockerfile]
    └──requires──> [MongoDB (or equivalent) Dockerfile]
    └──requires──> [docker-compose.yml binding them together]
```

### Dependency Notes

- **Content-hash URL requires normalization decision upfront:** Hash is computed on the JSON payload. If field ordering or whitespace matters, the hash will drift. Normalize before hashing (sort keys, strip whitespace).
- **"Open in app" link requires new frontend work:** The frontend already has `onImportJson` for file import; a URL-based import path (`?import=hash`) needs a small addition to `app.js` to fetch from the API on load. This is a differentiator, not table stakes — defer if needed.
- **Viewer page is independent of the main app:** It can be a separate static HTML file served by the .NET backend, or a minimal Razor page. It does not depend on `index.html`.
- **Docker must come early:** Local Docker is a project constraint, not a feature. It gates all team testing. Build it in the first working phase, not at the end.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the core share-by-link flow.

- [ ] **POST `/documents`** — Accept JSON payload with JWT auth, store it, return `{id, url}` — *without this there's no product*
- [ ] **GET `/documents/{hash}`** — Return stored JSON publicly (no auth) — *enables the share*
- [ ] **PUT `/documents/{hash}`** — Replace stored JSON with JWT auth — *enables the update-in-place flow*
- [ ] **Content-hash as document key** — Same payload = same URL, natural dedup — *recommended but could use random UUID as fallback if hash collision handling is a concern*
- [ ] **Frontend shows shareable URL + Copy button after upload** — Small change to existing upload success handler in `app.js`
- [ ] **Docker Compose** — .NET API + MongoDB (or compatible) runnable with one command locally

### Add After Validation (v1.x)

Features to add once the core upload → share → replace loop is confirmed working.

- [ ] **Formatted JSON viewer page at `/view/{hash}`** — Better consumer experience; low effort with an off-the-shelf JSON web component
- [ ] **Download button on viewer page** — Trivial to add once viewer exists
- [ ] **"Open in app" deep link** — Requires small `app.js` addition to fetch JSON by hash on page load

### Future Consideration (v2+)

- [ ] **Deployment to free hosting target** — Fly.io or Railway for .NET; MongoDB Atlas free tier; defer until local flow is validated
- [ ] **Token refresh / longer-lived auth** — Only needed if JWT rotation becomes painful for the team

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| POST `/documents` (upload + return URL) | HIGH | LOW | P1 |
| GET `/documents/{hash}` (public view) | HIGH | LOW | P1 |
| PUT `/documents/{hash}` (replace with auth) | HIGH | LOW | P1 |
| Content-hash stable URL | HIGH | LOW–MEDIUM | P1 |
| Frontend: show URL + copy button after upload | HIGH | LOW | P1 |
| Docker Compose local dev | HIGH (constraint) | MEDIUM | P1 |
| Formatted JSON viewer page | MEDIUM | LOW–MEDIUM | P2 |
| Download button on viewer | MEDIUM | LOW | P2 |
| "Open in app" deep link | MEDIUM | LOW | P2 |
| Document metadata (name, created date) | LOW | LOW | P3 |
| Deployment to free hosting | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v1 — product doesn't function without it
- P2: Add in v1.x after core is validated
- P3: Future consideration

---

## Competitor / Analog Feature Analysis

This product is closest to **pastebin-style JSON sharing** (Pastebin, JSONBlob, Hastebin, dpaste) but constrained to a specific internal tool's export format with authenticated writes.

| Feature | JSONBlob.com | Pastebin | Our Approach |
|---------|--------------|----------|--------------|
| Public read by URL | ✅ | ✅ | ✅ Hash URL, no auth |
| Authenticated write | ❌ (open) | Optional | ✅ JWT required for write |
| Replace in-place | ✅ (PUT) | ❌ | ✅ PUT by hash |
| Content-hash URL | ❌ (random UUID) | ❌ (random) | ✅ SHA-256 of payload |
| Formatted viewer | ✅ | Syntax only | ✅ JSON viewer page |
| User accounts / history | Optional | Optional | ❌ Out of scope |
| Expiry | Optional | Optional | ❌ Permanent storage |
| Raw JSON endpoint | ✅ | ✅ | ✅ `Content-Type: application/json` |

**Key differentiator vs generic tools:** Content-hash URLs mean the team never has a "broken link" problem — the same route export always resolves to the same URL, and replacing it updates all existing links automatically.

---

## Sources

- Codebase inspection: `app.js` lines 5783–5850 (existing upload/export implementation)
- `index.html` lines 414–420 (existing Upload to API UI)
- `PROJECT.md` requirements and out-of-scope declarations
- Analog products analyzed: JSONBlob (jsonblob.com), Pastebin, Hastebin — behavior from training data (MEDIUM confidence)
- Content-hash URL pattern: standard practice in content-addressable storage (IPFS, Nix, etc.) — HIGH confidence

---

*Feature research for: Route JSON sharing web app*
*Researched: 2026-03-21*
