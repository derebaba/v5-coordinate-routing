---
phase: 01
slug: foundation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-21
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit for .NET API tests plus Docker Compose smoke validation |
| **Config file** | `backend/ShareService.Api.Tests\ShareService.Api.Tests.csproj` |
| **Quick run command** | `dotnet test` |
| **Full suite command** | `dotnet test && docker compose up -d --build && powershell -Command "try { $r = Invoke-WebRequest http://localhost:5000/health -UseBasicParsing; if ($r.StatusCode -ne 200) { exit 1 } } finally { docker compose down }"` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `dotnet test`
- **After every plan wave:** Run `dotnet test && docker compose up -d --build && powershell -Command "try { $r = Invoke-WebRequest http://localhost:5000/health -UseBasicParsing; if ($r.StatusCode -ne 200) { exit 1 } } finally { docker compose down }"`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-foundation-env | 01 | 1 | OPS-03 | unit/integration | `dotnet test --filter OPS03` | ❌ W0 | ⬜ pending |
| 01-foundation-compose | 01 | 1 | OPS-01 | smoke | `docker compose up -d --build && powershell -Command "try { Invoke-WebRequest http://localhost:5000/health -UseBasicParsing | Out-Null } finally { docker compose down }"` | ❌ W0 | ⬜ pending |
| 01-foundation-persist | 02 | 2 | OPS-02 | smoke/integration | `docker compose up -d && powershell -Command "docker exec $(docker compose ps -q mongo) mongosh --quiet --eval \"db.getSiblingDB('coordinate-routing').phase1.insertOne({probe:'ok'})\"; docker compose down; docker compose up -d; docker exec $(docker compose ps -q mongo) mongosh --quiet --eval \"db.getSiblingDB('coordinate-routing').phase1.findOne({probe:'ok'})\"; docker compose down"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend\ShareService.Api.Tests\` — xUnit test project for API and config validation
- [ ] `backend\ShareService.Api.Tests\HealthTests.cs` — verifies `/health` and required config behavior
- [ ] `backend\ShareService.Api.Tests\ConfigTests.cs` — verifies missing env vars fail startup or config binding
- [ ] `.gitignore` — contains `.env`
- [ ] `docker-compose.yml` — required for smoke validation
- [ ] `dotnet new xunit -o backend\ShareService.Api.Tests && dotnet add backend\ShareService.Api.Tests package Microsoft.AspNetCore.Mvc.Testing`

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Developer can follow the documented local workflow without guessing | OPS-01, OPS-03 | Command correctness can be automated, but clarity of the workflow in `README.md` still needs human review | Follow the documented start, stop, logs, and reset steps from a clean clone and confirm no hidden prerequisites are required |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
