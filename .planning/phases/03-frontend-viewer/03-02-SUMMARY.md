---
phase: 03-frontend-viewer
plan: 02
subsystem: frontend-viewer
tags: [share-url, viewer-page, clipboard, download, error-handling]
dependency_graph:
  requires: [03-01]
  provides: [share-url-display, viewer-rendering, viewer-download, viewer-error-handling]
  affects: [app.js, viewer.html]
tech_stack:
  added: []
  patterns: [createElement-only-rendering, clipboard-api, blob-download, inline-css-js]
key_files:
  created: []
  modified:
    - app.js
    - backend/ShareService.Api/wwwroot/viewer.html
decisions:
  - "textContent/createElement only — no innerHTML with API data (XSS prevention)"
  - "Standalone viewer.html with inline CSS/JS — no external dependencies"
  - "Blob + object URL pattern for JSON download — no server round-trip needed"
metrics:
  duration: 3m
  completed: 2026-03-21
  tasks_completed: 2
  tasks_total: 3
  status: paused-at-checkpoint
---

# Phase 03 Plan 02: Share URL Display & Viewer Page Summary

**One-liner:** Share URL with clipboard copy button in upload handler + full standalone viewer page with city/school rendering, error states, and JSON download

## What Was Done

### Task 1: Share URL display + copy button in app.js
- **Commit:** 7676a11
- Replaced plain "Uploaded. ID: {id}" text with clickable share URL link
- Added "Copy Link" ghost button with clipboard API integration
- Success feedback: "Copied!" with green color for 2 seconds, then reverts
- Failure feedback: "Copy failed" with danger color
- Fallback: "Uploaded successfully." when `data.url` is missing
- XSS-safe: uses `createElement("a")` with `textContent`, not innerHTML

### Task 2: Full viewer page — rendering, error handling, download
- **Commit:** 2274068
- Replaced 11-line placeholder with 305-line standalone HTML page
- Inline CSS matching project design language (green palette, panel cards, table styling)
- City sections: name heading, summary stats (schools · researchers · working days), schools table
- Error handling: 404 ("Document not found"), network failure ("check your connection"), malformed data ("unsupported format")
- Download JSON button: Blob + object URL pattern, filename `shared-document-{id}.json`
- Dynamic title: "Shared: {cityName} — Fieldwork Scheduler"
- Accessibility: `role="alert"` on error, proper button elements, focus styles

### Task 3: Checkpoint (human-verify)
- **Status:** PENDING — awaiting user verification of end-to-end share workflow

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- ✅ All 18 backend tests pass (including 2 ViewerTests)
- ✅ All share URL patterns found in app.js (navigator.clipboard.writeText, data.url, Copy Link, Copied!, Copy failed, createElement("a"), className = "ghost")
- ✅ Old pattern "Uploaded. ID:" removed from app.js
- ✅ viewer.html contains all 5 required functions (renderDocument, loadDocument, downloadJson, showError, buildSchoolsTable)
- ✅ viewer.html has 0 innerHTML occurrences (XSS-safe)
- ✅ viewer.html is 305 lines (exceeds 150 minimum)
- ✅ All CSS variables present (--bg, --panel, --primary, --danger, --err-bg)

## Self-Check: PASSED

All files exist, all commits verified.

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| SHARE-01 | ✅ Done | Share URL displayed as clickable link after upload |
| SHARE-02 | ✅ Done | Copy Link button with clipboard API + Copied! feedback |
| VIEW-01 | ✅ Done | City sections with summary stats and schools tables |
| VIEW-02 | ✅ Done | Error panels for 404, network failure, malformed data |
| VIEW-03 | ✅ Done | Download JSON button with blob download |
