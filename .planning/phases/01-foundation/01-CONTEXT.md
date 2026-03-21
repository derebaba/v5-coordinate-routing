# Phase 1: Foundation - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the initial local runtime foundation for the share service so the stack can be started reliably, configured safely, and persisted across restarts. This phase covers Docker, the initial .NET API scaffold, MongoDB wiring, health checks, and secret/config handling. It does not yet implement document upload, public reads, replacement, or viewer behavior.

</domain>

<decisions>
## Implementation Decisions

### Local run flow
- Use a single primary local startup path: `docker compose up --build`.
- The API should be reachable from the host on `http://localhost:5000`, matching the existing frontend placeholder in `index.html`.
- MongoDB should run as an internal Docker service and not require direct host access for normal app usage.
- The stack should include a basic health endpoint so local startup can be verified without guessing.

### Config and secrets
- Store local secrets in a root `.env` file that is gitignored.
- Commit a root `.env.example` file with placeholders only, including Mongo connection, JWT secret, and allowed origins values.
- Do not hardcode secrets in source files, Docker files, or committed app settings.
- Keep configuration environment-driven from the first scaffold so later deployment uses the same pattern.

### Repository structure
- Add the new .NET backend in a dedicated subdirectory rather than mixing server files into the existing static frontend root.
- Keep the current frontend files (`index.html`, `app.js`, `styles.css`) in place during this phase; this phase prepares the backend foundation rather than reorganizing frontend behavior.
- Prefer a layout that keeps Docker, backend source, and top-level docs easy to find from the repo root.

### Docker reset and persistence workflow
- Use a named Docker volume for MongoDB data so local data survives normal `docker compose down` and restart cycles.
- Favor standard Docker Compose commands for reset/debug workflows instead of custom scripts in this phase.
- Document the common workflows clearly: start, rebuild, stop, view logs, and full reset when needed.

### Claude's Discretion
- Exact backend folder name and .NET project naming
- Exact container names and compose service names
- Exact health-check implementation details
- Whether to expose MongoDB to the host for optional debugging, as long as the default workflow stays simple

</decisions>

<specifics>
## Specific Ideas

- Keep the current `index.html`-based workflow intact while the backend foundation is introduced beside it.
- Use standard defaults for Phase 1 rather than custom local tooling or a bespoke development workflow.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — Product direction, hard constraints, and locked project decisions
- `.planning/REQUIREMENTS.md` — Phase-linked requirements, especially `OPS-01`, `OPS-02`, and `OPS-03`
- `.planning/ROADMAP.md` — Fixed Phase 1 goal, dependencies, and success criteria
- `.planning/STATE.md` — Current accumulated decisions affecting foundation work

### Research
- `.planning/research/SUMMARY.md` — Recommended stack, resolved contradictions, and phase ordering rationale

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `index.html` backup section already includes API configuration inputs and an Upload button, so the local backend should be reachable at a predictable base URL for future phases.
- `app.js` already posts JSON to `${baseUrl}/documents` with a bearer token, which means the foundation phase should preserve a straightforward host-accessible API entry point.
- `README.md` already documents how the browser-first app is run today, so it is the natural place to add the future local stack commands.

### Established Patterns
- The current app is a plain static frontend with no build step, so foundation work should avoid introducing unnecessary frontend tooling.
- The repo currently uses root-level app files, which means backend additions should be clearly separated rather than blended into existing frontend files.

### Integration Points
- `index.html` line range around the backup section references `http://localhost:5000` as the example API URL, so the local API host port should stay aligned with that expectation unless a later phase changes the frontend.
- `app.js` `onUploadToApi()` expects a `/documents` endpoint and bearer auth, so the Phase 1 scaffold should prepare the API project and config model that Phase 2 will build on.

</code_context>

<deferred>
## Deferred Ideas

- Actual `/documents` endpoint behavior and payload handling — Phase 2
- Share URL rendering and copy UX — Phase 3
- Viewer page behavior and recipient experience — Phase 3
- Fly.io deployment specifics and Atlas production configuration — Phase 4

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-21*
