---
phase: 02
slug: core-api
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit 2.6.6 + Mongo2Go 3.1.3 + WebApplicationFactory |
| **Config file** | `backend/ShareService.Api.Tests/ShareService.Api.Tests.csproj` |
| **Quick run command** | `dotnet test backend/ShareService.Api.Tests --verbosity quiet` |
| **Full suite command** | `dotnet test backend/ShareService.Api.Tests --verbosity normal` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `dotnet test backend/ShareService.Api.Tests --verbosity quiet`
- **After every plan wave:** Run `dotnet test backend/ShareService.Api.Tests --verbosity normal`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-01 | integration | `dotnet test --filter "Post_WithValidToken"` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-01 | integration | `dotnet test --filter "Post_WithoutToken"` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | AUTH-02 | integration | `dotnet test --filter "Get_ExistingDocument"` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | DOC-01 | integration | `dotnet test --filter "Post_WithValidToken_ReturnsCreated"` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | DOC-02 | integration | `dotnet test --filter "Post_ResponseShape"` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | DOC-03 | integration | `dotnet test --filter "Put_ReplacesPayload"` | ❌ W0 | ⬜ pending |
| 02-01-07 | 01 | 1 | DOC-04 | integration | via GET after POST in same test | ❌ W0 | ⬜ pending |
| 02-01-08 | 01 | 1 | DOC-05 | integration | `dotnet test --filter "Post_PreservesRouteCache"` | ❌ W0 | ⬜ pending |
| 02-01-09 | 01 | 1 | DOC-06 | integration | `dotnet test --filter "Post_OversizedPayload_Returns413"` | ❌ W0 | ⬜ pending |
| 02-01-10 | 01 | 1 | SHARE-03 | integration | `dotnet test --filter "Get_ExistingDocument_ReturnsPayload"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/ShareService.Api.Tests/DocumentsTests.cs` — integration tests for all 3 endpoints covering AUTH-01, AUTH-02, DOC-01–DOC-06, SHARE-03
- [ ] Test helper for creating authenticated `HttpClient` with bearer token — avoid duplication across tests

*Existing infrastructure covers framework and fixtures — no new installs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| BsonDocument round-trip fidelity with real routeCache | DOC-05 | Edge cases depend on actual payload shapes | Upload real exported JSON via curl, GET it back, diff the payloads |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
