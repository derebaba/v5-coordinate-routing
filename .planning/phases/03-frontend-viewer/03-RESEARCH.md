# Phase 3: Frontend + Viewer - Research

**Researched:** 2026-03-21
**Domain:** Vanilla JS frontend integration + server-rendered HTML viewer page for shared route documents
**Confidence:** HIGH

## Summary

Phase 3 has two distinct parts: (1) enhancing the existing `index.html` frontend to display the shareable URL and copy button after upload, and (2) building a new viewer page served at `/viewer/{id}` that renders shared route documents in a formatted, human-readable layout. Both parts are pure vanilla HTML/CSS/JS — the project uses no frontend framework, no bundler, and no npm. The existing frontend (`index.html`, `app.js`, `styles.css`) is a 5,400-line single-file vanilla JS app with inline DOM manipulation. The backend is .NET 8 Minimal API with `UseStaticFiles()` middleware already enabled.

The viewer page will be a standalone HTML file served as a static file through `UseStaticFiles()`, with JavaScript that fetches `/documents/{id}` on load and renders the document data. The existing API already returns stored JSON at `GET /documents/{id}` (Phase 2 complete). The upload response already returns `{id, url, createdAt}` — the frontend currently shows only the ID in a status `<span>`. Phase 3 turns that into a clickable link with a copy button.

**Primary recommendation:** Add share URL display and copy button directly in `app.js` within the existing `onUploadToApi()` success handler. Create `viewer.html` (standalone page with inline or linked CSS) served from `wwwroot/` that fetches and renders document data. Add a `/viewer/{id}` fallback route in Program.cs so ASP.NET serves the viewer HTML for any viewer path (SPA-style catch-all for the viewer).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHARE-01 | Frontend displays the full shareable URL after a successful upload | Modify `onUploadToApi()` success handler in `app.js` (line 5834-5838) to render URL as clickable `<a>` link in `#upload-to-api-status` area |
| SHARE-02 | Team member can copy the shareable URL from the frontend | Add a "Copy Link" button next to the displayed URL; use `navigator.clipboard.writeText()` API |
| VIEW-01 | Anyone with a share URL can open a formatted read-only viewer page | Create `viewer.html` in `wwwroot/` served by `UseStaticFiles()`; JS fetches `/documents/{id}` and renders formatted layout |
| VIEW-02 | Viewer page handles invalid or unsupported document data with a clear error state | Viewer JS handles 404 from API, network errors, and malformed/missing JSON fields with user-facing error messages |
| VIEW-03 | Viewer page provides a download action for the shared JSON document | Download button creates a `Blob` from the fetched JSON and triggers `<a>` download (same pattern as `onExportJson()` in app.js line 5789) |
</phase_requirements>

## Standard Stack

### Core (Already In Project — No New Dependencies)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| ASP.NET Core 8.0 | .NET 8.0 | Minimal API + static file serving | ✅ In project |
| Vanilla JS | ES2020+ | Frontend logic (no framework) | ✅ Existing pattern |
| Vanilla CSS | CSS3 | Styling with CSS custom properties | ✅ Existing pattern |
| MongoDB.Driver | 2.28.0 | Document storage (already complete) | ✅ In project |

### No New Packages Needed

This phase requires zero new NuGet packages or frontend libraries:

- **No frontend framework** — The project is vanilla JS with DOM manipulation. Adding React/Vue would be a rewrite.
- **No CSS framework** — The project uses hand-written CSS with custom properties (`:root` variables). Match the existing design language.
- **No clipboard library** — `navigator.clipboard.writeText()` is supported in all modern browsers.
- **No markdown/rendering library** — The viewer renders structured data (schools, researchers, day plans), not markdown. Simple HTML tables/sections suffice.
- **No bundler** — No webpack, vite, or esbuild. Files are served directly via `UseStaticFiles()`.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla viewer HTML | Server-side Razor page | Would add complexity; static HTML + fetch is simpler and consistent with existing pattern |
| `navigator.clipboard.writeText()` | `document.execCommand('copy')` | `execCommand` is deprecated; `navigator.clipboard` is the modern standard |
| Standalone viewer.html | Embedding viewer in index.html | Viewer must work for unauthenticated recipients who don't use the scheduler app |

## Architecture Patterns

### How Static Files Are Served

The .NET API already calls `app.UseStaticFiles()` in `Program.cs` (line 49). This serves files from `wwwroot/` by default. However:

1. **`wwwroot/` directory does not exist yet** — it needs to be created under `backend/ShareService.Api/`
2. **The Dockerfile does not copy static files** — it only copies and builds the .NET project. The viewer HTML must end up in the published output's `wwwroot/` folder.
3. The `.csproj` uses `Microsoft.NET.Sdk.Web` which automatically includes `wwwroot/` content in publish output — no explicit `<Content>` items needed.

### Recommended Structure

```
backend/ShareService.Api/
├── wwwroot/
│   └── viewer.html          # Standalone viewer page (HTML + inline JS + inline CSS or linked)
├── Program.cs                # Add viewer fallback route
├── Dockerfile                # No changes needed — SDK.Web auto-includes wwwroot/
└── ...

(root)
├── index.html                # Existing frontend (SHARE-01, SHARE-02 changes)
├── app.js                    # Upload handler modifications
├── styles.css                # Minor additions for share URL display
└── ...
```

### Pattern 1: Viewer Fallback Route (SPA-style catch-all)

**What:** The viewer URL is `/viewer/{id}` but `viewer.html` is a static file at `/viewer.html`. ASP.NET won't serve a static file for `/viewer/abc-123`. A route in `Program.cs` must catch `/viewer/{id}` and return the `viewer.html` content.

**When to use:** Whenever a static HTML page needs to handle dynamic URL segments.

**Example:**
```csharp
// In Program.cs — after UseStaticFiles(), before app.Run()
app.MapGet("/viewer/{id}", async (string id, IWebHostEnvironment env) =>
{
    var filePath = Path.Combine(env.WebRootPath, "viewer.html");
    if (!File.Exists(filePath))
        return Results.NotFound();
    var html = await File.ReadAllTextAsync(filePath);
    return Results.Content(html, "text/html");
});
```

The viewer.html JavaScript then reads the `{id}` from `window.location.pathname`:
```javascript
const pathParts = window.location.pathname.split('/');
const docId = pathParts[pathParts.length - 1];
```

### Pattern 2: Share URL Display After Upload

**What:** After a successful upload, display the full URL as a clickable link with a copy button, replacing the current text-only status.

**Current code (app.js:5834-5838):**
```javascript
if (res.ok) {
  const data = await res.json().catch(() => ({}));
  const id = data.id || data._id || "";
  status.textContent = id ? `Uploaded. ID: ${id}` : "Uploaded successfully.";
  status.style.color = "var(--color-success, #27ae60)";
}
```

**New pattern:**
```javascript
if (res.ok) {
  const data = await res.json().catch(() => ({}));
  const shareUrl = data.url || "";
  if (shareUrl) {
    status.innerHTML = "";
    const link = document.createElement("a");
    link.href = shareUrl;
    link.target = "_blank";
    link.textContent = shareUrl;
    link.style.wordBreak = "break-all";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "ghost";
    copyBtn.textContent = "Copy Link";
    copyBtn.style.marginLeft = "8px";
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy Link"; }, 2000);
      } catch {
        // Fallback: select text for manual copy
        copyBtn.textContent = "Copy failed";
      }
    });

    status.appendChild(link);
    status.appendChild(copyBtn);
    status.style.color = "var(--color-success, #27ae60)";
  } else {
    status.textContent = "Uploaded successfully.";
    status.style.color = "var(--color-success, #27ae60)";
  }
}
```

### Pattern 3: Viewer Page Data Fetching and Rendering

**What:** Viewer page fetches document JSON via API and renders it as formatted HTML.

**Document shape** (from `normalizeState` / `onExportJson` in app.js):
```json
{
  "schemaVersion": 5,
  "selectedCityId": "city_abc123",
  "cities": [
    {
      "id": "city_abc123",
      "name": "Gaziantep",
      "createdAt": "2026-03-15T10:00:00.000Z",
      "schools": [
        { "id": "...", "name": "School Name", "district": "...", "schoolType": "Sabahci", ... }
      ],
      "researchers": [
        { "id": "...", "fullName": "Name", "active": true, ... }
      ],
      "dayPlans": [
        { "id": "...", "date": "2026-04-01", "notes": "", "locked": false, ... }
      ],
      "researcherAssignments": [ ... ],
      "routeCache": [ ... ],
      "dayVerifications": [ ... ],
      "manualFollowUpWarnings": [ ... ]
    }
  ]
}
```

**Viewer rendering approach:**
```javascript
async function loadDocument() {
  const id = window.location.pathname.split('/').pop();
  try {
    const res = await fetch(`/documents/${id}`);
    if (!res.ok) {
      if (res.status === 404) return showError("Document not found.");
      return showError(`Error loading document (${res.status}).`);
    }
    const data = await res.json();
    renderDocument(data);
  } catch (err) {
    showError("Failed to load document. Please check your connection.");
  }
}

function renderDocument(data) {
  // Validate expected structure
  if (!data || !Array.isArray(data.cities)) {
    return showError("Unsupported document format.");
  }
  // Render each city's schools, researchers, day plans
  // ...
}
```

### Pattern 4: Download Button (Blob Download)

**What:** Reuse the exact same pattern already used in `onExportJson()` (app.js line 5789).

```javascript
function downloadJson(data, id) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shared-document-${id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Anti-Patterns to Avoid

- **Don't use `innerHTML` with user data** — The stored JSON contains user-entered school names, notes, etc. Always use `textContent` or `createElement` to prevent XSS. The viewer renders untrusted data from the database.
- **Don't parse the document ID from query strings** — The URL pattern is `/viewer/{id}`, not `/viewer?id=...`. Parse from pathname.
- **Don't add a frontend router** — This is a vanilla HTML page, not a SPA. One static HTML file that reads the URL is sufficient.
- **Don't duplicate the main app's CSS** — The viewer is a standalone page for recipients who may never use the scheduler. Use the same CSS variable palette (`:root` vars) but keep styles self-contained in the viewer file.
- **Don't make the viewer depend on `app.js`** — The viewer is a completely separate page. It should not load the 5,400-line `app.js`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard copy | Custom selection/execCommand logic | `navigator.clipboard.writeText()` | Standard API, works in all modern browsers, async-friendly |
| File download | Server-side download endpoint | Client-side Blob + object URL | Already proven pattern in app.js; no server change needed |
| URL routing for viewer | Custom URL parser or hash routing | `window.location.pathname.split('/')` | Simple path parsing; no library needed for a single route |
| Date formatting | Custom date parser | `new Date(str).toLocaleDateString()` | Built-in, locale-aware |

**Key insight:** Both the upload status enhancement and the viewer page are straightforward DOM manipulation tasks. The project's existing vanilla JS patterns (createElement, textContent, event listeners) are the right tool. No framework or library is needed.

## Common Pitfalls

### Pitfall 1: Viewer 404 for Static File Routes
**What goes wrong:** Requesting `/viewer/abc-123` returns 404 because `UseStaticFiles()` looks for a file at `wwwroot/viewer/abc-123`, which doesn't exist.
**Why it happens:** Static file middleware only serves literal file paths, not parameterized routes.
**How to avoid:** Add `app.MapGet("/viewer/{id}", ...)` in Program.cs that serves the `viewer.html` content for any `/viewer/{id}` path.
**Warning signs:** Viewer URL returns 404 or blank page when accessed directly.

### Pitfall 2: XSS via Document Content
**What goes wrong:** School names, notes, or other user-entered text contains HTML/script tags that execute when rendered.
**Why it happens:** Using `innerHTML` to display data from the API response.
**How to avoid:** Always use `textContent` or `createElement` for data values. Never inject API data via `innerHTML`.
**Warning signs:** Angle brackets or script tags in rendered output.

### Pitfall 3: Clipboard API Requires Secure Context
**What goes wrong:** `navigator.clipboard.writeText()` fails silently or throws in HTTP (non-HTTPS) context in some browsers.
**Why it happens:** The Clipboard API requires a secure context (HTTPS or localhost). Local dev at `http://localhost:5000` is fine. Production on HTTP would fail.
**How to avoid:** Localhost counts as secure context, so local dev works. Production should use HTTPS (Fly.io provides this by default). Add a try/catch with a fallback message.
**Warning signs:** "Copy" button does nothing when clicked.

### Pitfall 4: CORS Blocking Viewer Fetch
**What goes wrong:** Viewer page at `/viewer/{id}` tries to fetch `/documents/{id}` and gets CORS error.
**Why it happens:** This would only happen if the viewer were served from a different origin than the API.
**How to avoid:** Since the viewer is served by the same .NET API (via `UseStaticFiles()` or the fallback route), same-origin requests are made. No CORS issue. Use relative fetch paths (`/documents/${id}`) not absolute URLs.
**Warning signs:** CORS errors in browser console.

### Pitfall 5: wwwroot Not Included in Docker Build
**What goes wrong:** Viewer works in local dev but not in Docker — the `viewer.html` isn't in the container.
**Why it happens:** The Dockerfile copies `backend/ShareService.Api/` which includes `wwwroot/` because `Microsoft.NET.Sdk.Web` auto-includes it in publish. This should work automatically. But verify that `dotnet publish` output includes `wwwroot/viewer.html`.
**How to avoid:** After adding `wwwroot/viewer.html`, verify it appears in the publish output. The SDK.Web project type automatically includes wwwroot content.
**Warning signs:** 404 or missing viewer in containerized deployment.

### Pitfall 6: Missing or Malformed Document Data
**What goes wrong:** Viewer crashes or shows blank content when the document has unexpected structure.
**Why it happens:** Schema differences, older exports, or non-scheduler JSON uploaded to the API.
**How to avoid:** Defensive rendering — check for `data.cities`, check array lengths, use fallback text for missing fields. Show "Unsupported document format" error state instead of crashing.
**Warning signs:** JavaScript errors in console, blank viewer page.

## Code Examples

### Viewer HTML Structure
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shared Route Document</title>
  <style>
    /* Use same design language as main app */
    :root {
      --bg: #f4f7f3;
      --panel: #ffffff;
      --line: #d5dfd2;
      --text: #1d2a1f;
      --muted: #5d6b60;
      --primary: #1e7a46;
      --primary-dark: #176138;
      --danger: #c53e3e;
      --err-bg: #fff0f0;
      --err-line: #e4a0a0;
    }
    body { margin: 0; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
           background: linear-gradient(160deg, #eef4ea 0%, var(--bg) 45%, #f8fbf8 100%);
           color: var(--text); }
    .container { max-width: 1100px; margin: 22px auto; padding: 0 16px; }
    .panel { background: var(--panel); border: 1px solid var(--line);
             border-radius: 12px; padding: 14px; margin-bottom: 14px;
             box-shadow: 0 7px 20px rgba(17,31,17,0.05); }
    .error-panel { background: var(--err-bg); border-color: var(--err-line); text-align: center; padding: 40px; }
    /* ... more styles matching the project's design language ... */
  </style>
</head>
<body>
  <main class="container">
    <header class="panel">
      <h1>Shared Route Document</h1>
      <div id="actions" hidden>
        <button id="download-btn" type="button">Download JSON</button>
      </div>
    </header>
    <div id="loading">Loading document…</div>
    <div id="error" class="panel error-panel" hidden></div>
    <div id="content" hidden></div>
  </main>
  <script>
    // Viewer JavaScript — fetch, render, error handling, download
  </script>
</body>
</html>
```

### Viewer Rendering: City Summary

For each city, show: name, school count, researcher count, day plan count.
For each school: name, district, school type, classrooms, status.

```javascript
function renderDocument(data) {
  document.getElementById("loading").hidden = true;
  document.getElementById("content").hidden = false;
  document.getElementById("actions").hidden = false;

  const content = document.getElementById("content");
  for (const city of data.cities) {
    const section = document.createElement("div");
    section.className = "panel";

    const h2 = document.createElement("h2");
    h2.textContent = city.name || "Unnamed City";
    section.appendChild(h2);

    // Summary stats
    const stats = document.createElement("p");
    stats.className = "muted";
    stats.textContent = `${city.schools?.length || 0} schools · ${city.researchers?.length || 0} researchers · ${city.dayPlans?.length || 0} working days`;
    section.appendChild(stats);

    // Schools table
    if (city.schools?.length) {
      const table = buildSchoolsTable(city.schools);
      section.appendChild(table);
    }

    content.appendChild(section);
  }
}
```

### ASP.NET Viewer Route

```csharp
app.MapGet("/viewer/{id}", async (string id, IWebHostEnvironment env) =>
{
    var filePath = Path.Combine(env.WebRootPath, "viewer.html");
    if (!File.Exists(filePath))
        return Results.NotFound();
    var html = await File.ReadAllTextAsync(filePath);
    return Results.Content(html, "text/html");
});
```

Note: `IWebHostEnvironment` is already available via DI in ASP.NET Core — no additional registration needed.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Deprecated since ~2020 | Use async clipboard API with try/catch |
| Server-side HTML rendering | Client-side fetch + DOM rendering | Modern SPA pattern | Viewer fetches JSON API and renders client-side; simpler than Razor |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated. Use `navigator.clipboard.writeText()` instead. Works on localhost and HTTPS origins.

## Open Questions

1. **Viewer URL in POST response**
   - What we know: `POST /documents` currently returns `{id, url}` where `url` is `https://host/documents/{id}` (the JSON API endpoint).
   - What's unclear: Should the URL returned by POST point to the viewer page (`/viewer/{id}`) instead of the raw JSON endpoint (`/documents/{id}`)? Or should both be returned?
   - Recommendation: Change the `url` in the POST response to point to `/viewer/{id}` since that's the shareable human-readable page. The JSON API endpoint is still accessible at `/documents/{id}` for programmatic use. Alternatively, return both fields: `url` (viewer) and `apiUrl` (JSON). Simplest approach: change `url` to `/viewer/{id}` since that's what gets shared.

2. **Viewer page title with document info**
   - What we know: The page `<title>` is set statically in HTML.
   - What's unclear: Should the title update dynamically after the document loads (e.g., "Shared: Gaziantep - Fieldwork Scheduler")?
   - Recommendation: Update `document.title` after fetch with the first city name. Low effort, nice polish.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | xUnit 2.6.6 + Mono2Go 3.1.3 + WebApplicationFactory |
| Config file | `backend/ShareService.Api.Tests/ShareService.Api.Tests.csproj` |
| Quick run command | `dotnet test backend/ShareService.Api.Tests --filter "ClassName~ViewerTests" --no-build` |
| Full suite command | `dotnet test backend/ShareService.Api.Tests` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHARE-01 | Frontend displays shareable URL after upload | manual-only | Manual: upload via UI, check URL appears as link | N/A — pure frontend DOM change |
| SHARE-02 | Copy button copies URL to clipboard | manual-only | Manual: click Copy Link button, paste elsewhere | N/A — clipboard requires browser |
| VIEW-01 | `/viewer/{id}` renders formatted document | integration | `dotnet test backend/ShareService.Api.Tests --filter "ClassName~ViewerTests"` | ❌ Wave 0 |
| VIEW-02 | `/viewer/{id}` for missing doc shows error | integration | `dotnet test backend/ShareService.Api.Tests --filter "ClassName~ViewerTests"` | ❌ Wave 0 |
| VIEW-03 | Viewer provides download button | manual-only | Manual: click Download button in viewer, verify file saved | N/A — download requires browser |

**Manual-only justifications:**
- SHARE-01 / SHARE-02: These are pure frontend DOM changes in a vanilla JS app. Testing would require a browser automation framework (Playwright/Selenium) which is not in the project's test stack and disproportionate for a small team tool.
- VIEW-03: Download button triggers a client-side Blob download — requires a real browser to verify.

**Integration tests cover:**
- VIEW-01: `GET /viewer/{id}` returns `text/html` content type and 200 status when document exists
- VIEW-02: `GET /viewer/{id}` returns the viewer HTML (not 404) even for a non-existent document ID — the viewer HTML itself shows the error state client-side after fetching `/documents/{id}` and receiving 404. Alternatively, test that the route exists and returns HTML.

### Sampling Rate
- **Per task commit:** `dotnet test backend/ShareService.Api.Tests --no-build`
- **Per wave merge:** `dotnet test backend/ShareService.Api.Tests`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `backend/ShareService.Api.Tests/ViewerTests.cs` — covers VIEW-01, VIEW-02 (viewer route returns HTML)
- [ ] `backend/ShareService.Api/wwwroot/viewer.html` — the viewer page itself (must exist before tests reference it)

## Sources

### Primary (HIGH confidence)
- **Project codebase** — `app.js` (5,415 lines), `index.html`, `styles.css`, `Program.cs`, `Dockerfile`, `docker-compose.yml` — all read directly
- **ASP.NET Core 8 Static Files** — `UseStaticFiles()` serves from `wwwroot/` by default; `Microsoft.NET.Sdk.Web` auto-includes in publish. Verified from project's existing `Program.cs` line 49.
- **Existing upload handler** — `onUploadToApi()` at app.js:5798-5850 shows current response handling and DOM update pattern
- **Existing export pattern** — `onExportJson()` at app.js:5783-5796 shows Blob download pattern to reuse
- **Document data shape** — `normalizeState()` at app.js:909-1084 defines the full structure: `{schemaVersion, selectedCityId, cities: [{name, schools, researchers, dayPlans, researcherAssignments, routeCache, dayVerifications, ...}]}`

### Secondary (MEDIUM confidence)
- **`navigator.clipboard.writeText()`** — Standard Web API, widely supported. Requires secure context (HTTPS or localhost). Verified as standard in MDN Web Docs.
- **ASP.NET `MapGet` with `IWebHostEnvironment`** — Standard DI-available service in ASP.NET Core for accessing `WebRootPath`. Consistent with existing minimal API patterns in `Program.cs`.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new dependencies; all patterns verified in existing codebase
- Architecture: HIGH — Static file serving pattern well understood; fallback route is standard ASP.NET Core
- Pitfalls: HIGH — XSS, CORS, and clipboard issues are well-documented browser platform concerns
- Viewer data shape: HIGH — Verified directly from `normalizeState()` in app.js

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable — no moving parts; all patterns are platform-level)
