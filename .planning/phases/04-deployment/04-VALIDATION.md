---
phase: 4
slug: deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit 2.6.6 + Microsoft.NET.Test.Sdk 17.8.0 |
| **Config file** | none — convention-based test discovery |
| **Quick run command** | `dotnet test backend/ShareService.Api.Tests/ShareService.Api.Tests.csproj --filter "HealthTests|ConfigTests" -v minimal` |
| **Full suite command** | `dotnet test v5-coordinate-routing.sln -v minimal` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `dotnet test backend/ShareService.Api.Tests/ShareService.Api.Tests.csproj --filter "HealthTests|ConfigTests" -v minimal`
- **After every plan wave:** Run `dotnet test v5-coordinate-routing.sln -v minimal`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | OPS-04 | config/smoke | `pwsh -NoProfile -Command "Test-Path fly.toml; Select-String -Path fly.toml -Pattern 'internal_port\s*=\s*8080','path\s*=\s*\"/health\"','force_https\s*=\s*true'"` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | OPS-05 | docs/smoke | `pwsh -NoProfile -Command "Select-String -Path README.md -Pattern 'fly auth login','fly launch --no-deploy','fly secrets set','fly deploy','/health'"` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | OPS-05 | script/smoke | `pwsh -NoProfile -File scripts/verify-deploy.ps1 -Help` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `fly.toml` — deployment manifest required by OPS-04
- [ ] README deployment section — zero-to-deploy and troubleshooting required by OPS-05
- [ ] `scripts/verify-deploy.ps1` — repeatable post-deploy verification checks
- [ ] `backend/ShareService.Api.Tests/DeploymentDocsTests.cs` (optional docs guardrail)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real Fly deploy succeeds in target region (`fra`) | OPS-04 | Requires real cloud account and infra | Run README deploy steps with real app and verify deployment reaches healthy state |
| Atlas allowlist/security tradeoff documented clearly | OPS-05 | Documentation quality/contextual clarity | Review README section for explicit `0.0.0.0/0` tradeoff and hardening guidance |
| Production CORS exact origin behavior | OPS-04 | Requires deployed Fly domain and browser/API behavior | Set `Cors__AllowedOrigins=https://<app>.fly.dev`, verify requests from other origins fail |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
