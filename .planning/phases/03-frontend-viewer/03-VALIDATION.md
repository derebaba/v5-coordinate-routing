---
phase: 3
slug: frontend-viewer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit 2.6.6 + WebApplicationFactory |
| **Config file** | `backend/ShareService.Api.Tests/ShareService.Api.Tests.csproj` |
| **Quick run command** | `dotnet test backend/ShareService.Api.Tests --filter "ClassName~ViewerTests" --no-build` |
| **Full suite command** | `dotnet test backend/ShareService.Api.Tests` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `dotnet test backend/ShareService.Api.Tests --no-build`
- **After every plan wave:** Run `dotnet test backend/ShareService.Api.Tests`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SHARE-01 | manual-only | Manual: upload via UI, check URL appears as link | N/A | ⬜ pending |
| 03-01-02 | 01 | 1 | SHARE-02 | manual-only | Manual: click Copy Link button, paste elsewhere | N/A | ⬜ pending |
| 03-02-01 | 02 | 1 | VIEW-01 | integration | `dotnet test backend/ShareService.Api.Tests --filter "ClassName~ViewerTests"` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | VIEW-02 | integration | `dotnet test backend/ShareService.Api.Tests --filter "ClassName~ViewerTests"` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | VIEW-03 | manual-only | Manual: click Download button in viewer, verify file saved | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/ShareService.Api.Tests/ViewerTests.cs` — stubs for VIEW-01, VIEW-02 (viewer route returns HTML)
- [ ] `backend/ShareService.Api/wwwroot/viewer.html` — viewer page must exist before tests reference it

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Frontend displays shareable URL after upload | SHARE-01 | Pure frontend DOM change in vanilla JS — no browser automation in test stack | Upload a document via UI, verify shareable URL appears as clickable link |
| Copy button copies URL to clipboard | SHARE-02 | Clipboard API requires real browser context | Click Copy Link button after upload, paste into text editor to verify |
| Viewer provides download button | VIEW-03 | Blob download triggers client-side file save — requires real browser | Open viewer page, click Download JSON, verify file downloads |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
