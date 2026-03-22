# Phase 4: Deployment - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver deployment-ready Fly.io configuration and documentation so the team can deploy the .NET API + MongoDB Atlas connection with no manual guesswork. Scope includes deploy config, required secrets/envs, production CORS setup, and end-to-end deployment/verification docs.

</domain>

<decisions>
## Implementation Decisions

### Fly.io Deployment Shape
- Deploy as a single always-on API instance (no scale-to-zero behavior in v1)
- Default Fly region is `fra`
- Health check strategy: HTTP check against `/health` only
- Enforce HTTPS in deployment configuration where applicable

### Atlas Connectivity Strategy
- Default Atlas network allowlist guidance: `0.0.0.0/0` for v1 simplicity
- README must include explicit security tradeoff note and future hardening guidance
- Production DB connection is set as one full secret value: `Mongo__ConnectionString`
- Production docs require TLS Atlas URI format: `mongodb+srv://...`

### Production CORS + Secrets
- Production CORS default is a single explicit Fly origin only
- Production CORS value is set separately from local dev (`Cors__AllowedOrigins=https://<app>.fly.dev`)
- README includes copy-paste JWT secret generation command examples
- All required production secrets must be set via `fly secrets set` before first deploy (no fallback defaults)

### Deployment Documentation Depth
- README deployment section must be full copy-paste, zero-to-deploy
- Include Fly CLI auth/app creation steps (`fly auth login`, `fly launch --no-deploy`)
- Include post-deploy verification commands (health + sample upload flow)
- Include quick troubleshooting section for common failures (bad secret, CORS mismatch, Atlas auth/network issues)

### Claude's Discretion
- Exact Fly machine sizing defaults for v1 (smallest practical)
- Exact `fly.toml` field ordering and comments
- Exact wording/format of troubleshooting decision tree

</decisions>

<specifics>
## Specific Ideas

- Keep deployment flow frictionless for small team usage — copy/paste commands should work as written
- Prefer explicit defaults over implicit behavior (region, origin, required secrets)
- Deployment docs should prove success with concrete verification commands, not just "deploy and hope"

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product + Requirement Sources
- `.planning/ROADMAP.md` — Phase 4 goal, dependencies, and success criteria
- `.planning/REQUIREMENTS.md` — OPS-04 and OPS-05 requirements
- `.planning/STATE.md` — deployment blocker note about Atlas allowlist tradeoff
- `.planning/PROJECT.md` — project constraints and deployment target context

### Existing Runtime/Config Baseline
- `docker-compose.yml` — current local service topology (api + mongo)
- `.env.example` — current env var naming conventions (`Mongo__ConnectionString`, `Auth__JwtSecret`, `Cors__AllowedOrigins`)
- `backend/ShareService.Api/Program.cs` — runtime config keys and `/health` endpoint behavior

### Prior Research Context
- `.planning/research/STACK.md` — selected hosting/database stack rationale
- `.planning/research/ARCHITECTURE.md` — architecture considerations informing deployment shape
- `.planning/research/SUMMARY.md` — consolidated rationale used by roadmap phases

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing `/health` endpoint in API for Fly HTTP health checks
- Existing env-driven config pattern already uses deploy-friendly names
- Existing Dockerfile/container build path can be reused for Fly deployment

### Established Patterns
- Runtime configuration is environment-first (no hardcoded secrets)
- CORS is controlled via env var `Cors__AllowedOrigins`
- API currently exposed on container port 8080 and host port 5000 in local compose

### Integration Points
- Add `fly.toml` at repo root aligned with current API container behavior
- Update README with deployment section and validation/troubleshooting commands
- Ensure production env vars map directly to existing Program.cs config keys

</code_context>

<deferred>
## Deferred Ideas

- Tight Fly egress IP allowlisting for Atlas (post-v1 hardening phase)
- Advanced autoscaling/high-availability deployment patterns

</deferred>

---

*Phase: 04-deployment*
*Context gathered: 2026-03-22*
