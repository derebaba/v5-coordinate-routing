# Phase 4: Deployment - Research

**Researched:** 2026-03-22  
**Domain:** Fly.io deployment for .NET 8 API + MongoDB Atlas connectivity and runbook documentation  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Tight Fly egress IP allowlisting for Atlas (post-v1 hardening phase)
- Advanced autoscaling/high-availability deployment patterns
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OPS-04 | Project includes deployment-ready configuration for a free hosting target | `fly.toml` template with `internal_port=8080`, `primary_region=fra`, `force_https=true`, HTTP health check on `/health`, always-on machine settings, and env/secrets mapping to existing `Program.cs` keys |
| OPS-05 | Project documents the selected free hosting target and how to deploy to it | README runbook with exact commands (`fly auth login`, `fly launch --no-deploy`, `fly secrets set`, `fly deploy`, verification + troubleshooting) |
</phase_requirements>

## Summary

Phase 4 is primarily an **operations packaging phase**, not a feature build phase. The API already has the critical production traits needed for deployment: fail-fast required config keys (`Mongo:ConnectionString`, `Mongo:DatabaseName`, `Auth:JwtSecret`, `Cors:AllowedOrigins`), a `/health` endpoint suitable for platform health checks, containerization via Dockerfile, and static file serving for viewer/edit pages. This means deployment work should focus on creating deterministic infrastructure config and deterministic operator documentation.

Given locked decisions, planning should be prescriptive around one path only: **Fly.io app + MongoDB Atlas connection string secret + explicit Fly origin CORS**. Do not spend planning budget on platform comparisons or autoscaling architectures. The key risk to eliminate is “works locally, fails in cloud” due to missing secrets, wrong env key names, wrong CORS origin, or Atlas access configuration.

**Primary recommendation:** Implement a production-ready `fly.toml` plus a copy-paste README deployment runbook that sets required secrets before first deploy, then verifies with `/health` and one authenticated upload smoke test.

## Standard Stack

### Core
| Library / Service | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| Fly.io (Machines platform) | Current CLI-managed platform | Host containerized .NET API | Matches roadmap and phase context; simple `fly deploy` workflow |
| MongoDB Atlas | M0 free tier (current) | Managed NoSQL persistence | Meets free-hosting objective while keeping DB managed |
| ASP.NET Core | .NET 8 (`net8.0`) | API runtime | Already implemented and tested in repo |
| Dockerfile-based deploy | Existing `backend/ShareService.Api/Dockerfile` | Build runtime image for Fly | Reuses working local build path |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Fly CLI (`flyctl`) | Latest stable | App creation, secrets, deploy, logs | Always for deployment and operations |
| `curl` / PowerShell `Invoke-RestMethod` | Any | Post-deploy verification | Health + smoke upload/GET checks |
| xUnit + `dotnet test` | Existing test stack | Regression confidence pre/post deploy | Run before deploy and after deployment config changes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fly.io + Atlas | Render + Atlas | Conflicts with locked phase decision |
| Always-on single instance | Autoscaling/multi-region | Deferred by context; out of scope for v1 |

**Installation / setup commands:**
```bash
# Fly CLI login and app bootstrap
fly auth login
fly launch --no-deploy
```

## Architecture Patterns

### Recommended Project Structure
```text
/
├── fly.toml                                  # Fly deployment config (new)
├── README.md                                 # Zero-to-deploy runbook (update)
├── .env.example                              # Local-only example vars (already exists)
└── backend/ShareService.Api/
    ├── Program.cs                            # Required env keys + /health endpoint
    └── Dockerfile                            # Container build path used by Fly
```

### Pattern 1: Secret-Only Production Config
**What:** Keep all production-sensitive values in Fly secrets, with no fallback defaults.  
**When to use:** Always in this project (already enforced by fail-fast `Require(...)`).  
**Example:**
```bash
# Source: https://fly.io/docs/apps/secrets/
fly secrets set \
  Mongo__ConnectionString="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority" \
  Mongo__DatabaseName="coordinate-routing" \
  Auth__JwtSecret="<long-random-secret>" \
  Cors__AllowedOrigins="https://<app>.fly.dev"
```

### Pattern 2: Fly health-check alignment with existing endpoint
**What:** Configure Fly HTTP service check to `/health` on internal port `8080`.  
**When to use:** Always for this service, because `/health` already validates Mongo connectivity.  
**Example:**
```toml
# Source: https://fly.io/docs/reference/configuration/
[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

  [[http_service.checks]]
    interval = "15s"
    timeout = "5s"
    grace_period = "20s"
    method = "GET"
    path = "/health"
```

### Pattern 3: Atlas URI as single opaque secret
**What:** Use one full `mongodb+srv://...` secret (`Mongo__ConnectionString`) in production.  
**When to use:** Always for v1 per locked decision.  
**Example:**
```text
Mongo__ConnectionString=mongodb+srv://<username>:<password>@<cluster-url>/coordinate-routing?retryWrites=true&w=majority
```

### Anti-Patterns to Avoid
- **Setting `Mongo:ConnectionString` with colon in `fly secrets set`:** use double underscore (`Mongo__ConnectionString`) so ASP.NET configuration binding resolves correctly.
- **Using wildcard CORS in production:** locked decision requires a single explicit Fly origin.
- **Deploying before secrets are present:** app startup will fail by design (`Missing required config`).
- **Relying on Atlas IP restriction hardening in this phase:** explicitly deferred; document tradeoff and continue with `0.0.0.0/0`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TLS certificates | Custom cert provisioning scripts | Fly managed HTTPS + `force_https` | Built-in and simpler |
| Secret storage | Custom encrypted config files in repo | `fly secrets set` | Avoids secret leakage and repo drift |
| Database hosting | Self-managed Mongo VM/container for prod | MongoDB Atlas M0 | Lower ops overhead for v1 |
| Runtime health orchestration | Custom health daemon | Fly HTTP checks on `/health` | Native platform behavior |

**Key insight:** Phase 4 should stitch together existing runtime behavior with managed platform primitives, not introduce new infrastructure code.

## Common Pitfalls

### Pitfall 1: Wrong environment variable names in production
**What goes wrong:** App crashes on boot with missing config error.  
**Why it happens:** Setting `Mongo:ConnectionString` instead of `Mongo__ConnectionString` in Fly secrets.  
**How to avoid:** Use `__` keys exactly matching `.env.example` naming pattern.  
**Warning signs:** `fly logs` shows `Missing required config:` exceptions on startup.

### Pitfall 2: CORS mismatch after successful deploy
**What goes wrong:** Browser upload requests fail from frontend origin despite healthy backend.  
**Why it happens:** `Cors__AllowedOrigins` not equal to deployed Fly app URL (or includes local origins only).  
**How to avoid:** Set `Cors__AllowedOrigins=https://<app>.fly.dev` as production secret before deploy.  
**Warning signs:** Browser console CORS errors; `curl` works but browser calls fail.

### Pitfall 3: Atlas connectivity/auth failure
**What goes wrong:** `/health` returns failure or Fly checks mark instance unhealthy.  
**Why it happens:** Invalid Atlas credentials, missing DB name in URI, or Atlas network allowlist not configured.  
**How to avoid:** Use tested `mongodb+srv://` URI; ensure Atlas network access includes `0.0.0.0/0` for v1 per decision.  
**Warning signs:** Startup/health logs include Mongo timeout/auth exceptions.

### Pitfall 4: Non-reproducible deployment docs
**What goes wrong:** Teammates improvise steps and produce inconsistent environments.  
**Why it happens:** README gives concepts, not exact commands.  
**How to avoid:** Provide zero-to-deploy copy/paste command blocks and explicit placeholders.  
**Warning signs:** Frequent “what should I set here?” questions, repeated config drift.

## Code Examples

Verified patterns from project runtime and official platform docs:

### Fly config baseline (aligned to existing API)
```toml
# Source: https://fly.io/docs/reference/configuration/
app = "<app-name>"
primary_region = "fra"

[build]
  dockerfile = "backend/ShareService.Api/Dockerfile"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

  [[http_service.checks]]
    method = "GET"
    path = "/health"
    interval = "15s"
    timeout = "5s"
    grace_period = "20s"
```

### Post-deploy smoke verification
```bash
# Source: project requirement + existing endpoints in Program.cs
curl -fsS "https://<app>.fly.dev/health"

curl -X POST "https://<app>.fly.dev/documents" \
  -H "Authorization: Bearer <Auth__JwtSecret>" \
  -H "Content-Type: application/json" \
  --data '{"schemaVersion":5,"selectedCityId":"c1","cities":[]}'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Local-only `docker compose` runtime | Add Fly deployment manifest (`fly.toml`) + managed secrets | Phase 4 | Enables repeatable cloud deploy with same container |
| Local Mongo container | Atlas managed cluster via `mongodb+srv://` | Phase 4 | Persistent managed database in free hosting path |
| Implicit operator steps | Explicit runbook (`fly auth login` → `fly deploy` → verify) | Phase 4 | No-guess team onboarding and reproducible deployment |

**Deprecated/outdated for this phase:**
- Manual one-off dashboard clicking without command traceability
- Production secrets in `.env` committed or copied into repo files

## Open Questions

1. **Exact smallest practical Fly VM size for this workload**
   - What we know: Context locks “smallest practical”; app is low-traffic and lightweight.
   - What's unclear: Best memory/CPU preset under current Fly free limits for acceptable cold boot and Mongo latency.
   - Recommendation: Start with smallest shared-cpu machine available during `fly launch`, then capture observed memory usage in first deploy logs.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | xUnit 2.6.6 + Microsoft.NET.Test.Sdk 17.8.0 |
| Config file | none — convention-based test discovery |
| Quick run command | `dotnet test backend/ShareService.Api.Tests/ShareService.Api.Tests.csproj --filter "HealthTests|ConfigTests" -v minimal` |
| Full suite command | `dotnet test v5-coordinate-routing.sln -v minimal` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPS-04 | Fly deployment config exists and matches runtime contract (`8080`, `/health`, HTTPS, always-on) | config/smoke | `pwsh -NoProfile -Command "Test-Path fly.toml; Select-String -Path fly.toml -Pattern 'internal_port\\s*=\\s*8080','path\\s*=\\s*\"/health\"','force_https\\s*=\\s*true'"` | ❌ Wave 0 |
| OPS-05 | README documents end-to-end Fly+Atlas deployment runbook | docs/smoke | `pwsh -NoProfile -Command "Select-String -Path README.md -Pattern 'fly auth login','fly launch --no-deploy','fly secrets set','fly deploy','/health'"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `dotnet test backend/ShareService.Api.Tests/ShareService.Api.Tests.csproj --filter "HealthTests|ConfigTests" -v minimal`
- **Per wave merge:** `dotnet test v5-coordinate-routing.sln -v minimal`
- **Phase gate:** Full suite green + manual deployment smoke verification before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `fly.toml` — missing deployment manifest required by OPS-04
- [ ] README deployment section — missing zero-to-deploy and troubleshooting steps required by OPS-05
- [ ] `scripts/verify-deploy.ps1` (or equivalent) — repeatable post-deploy health/upload checks
- [ ] `backend/ShareService.Api.Tests/DeploymentDocsTests.cs` (optional docs guardrail) — assert README contains required command anchors

## Sources

### Primary (HIGH confidence)
- Repository: `backend/ShareService.Api/Program.cs` — required env keys, `/health`, CORS and auth behavior
- Repository: `backend/ShareService.Api/Dockerfile` — deployable container path and exposed port `8080`
- Repository: `.env.example` — canonical env variable names for deployment mapping
- Repository: `.planning/phases/04-deployment/04-CONTEXT.md` — locked phase decisions and deployment constraints
- Repository: `.planning/ROADMAP.md` + `.planning/REQUIREMENTS.md` — OPS-04/OPS-05 success criteria and requirement text

### Secondary (MEDIUM confidence)
- Fly configuration reference: https://fly.io/docs/reference/configuration/ (used for `fly.toml` structure guidance)
- Fly secrets guide: https://fly.io/docs/apps/secrets/ (used for secret injection pattern)
- Fly launch/deploy docs: https://fly.io/docs/launch/ and https://fly.io/docs/flyctl/deploy/ (used for runbook command sequence)
- MongoDB Atlas connection string format: https://www.mongodb.com/docs/atlas/connect-to-cluster/ (used for `mongodb+srv://` guidance)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: **MEDIUM** — aligned with locked project decisions and repo runtime, but external docs not re-fetched in-session.
- Architecture: **HIGH** — directly anchored to existing `Program.cs`, Dockerfile, and phase constraints.
- Pitfalls: **HIGH** — derived from fail-fast config behavior + known deployment failure modes in this exact stack.

**Research date:** 2026-03-22  
**Valid until:** 2026-04-21
