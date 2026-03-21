# Requirements: Coordinate Routing Share Service

**Defined:** 2026-03-21
**Core Value:** Make route export data easy to publish and share without passing JSON files around manually

## v1 Requirements

### Access

- [x] **AUTH-01**: Team member can authorize upload and replace actions by entering a shared bearer token in the existing frontend token field
- [x] **AUTH-02**: Unauthenticated users can open shared document URLs without signing in

### Documents

- [x] **DOC-01**: Team member can upload exported route JSON from the existing frontend to the backend
- [x] **DOC-02**: Backend returns a stable share ID and shareable URL after a successful upload
- [x] **DOC-03**: Team member can replace the JSON stored behind an existing share ID without changing the public URL
- [x] **DOC-04**: Shared documents are stored in a NoSQL database
- [x] **DOC-05**: Stored shared documents preserve `routeCache` data when persisted
- [x] **DOC-06**: Backend rejects oversized uploads with a clear error response

### Sharing

- [ ] **SHARE-01**: Frontend displays the full shareable URL after a successful upload
- [ ] **SHARE-02**: Team member can copy the shareable URL from the frontend
- [x] **SHARE-03**: Anyone with a share URL can retrieve the shared route document as JSON

### Viewer

- [ ] **VIEW-01**: Anyone with a share URL can open a formatted read-only viewer page for the shared route document
- [ ] **VIEW-02**: Viewer page handles invalid or unsupported document data with a clear error state
- [ ] **VIEW-03**: Viewer page provides a download action for the shared JSON document

### Operations

- [x] **OPS-01**: Team can start the full stack locally with Docker
- [x] **OPS-02**: Local Docker setup persists database data across restarts
- [x] **OPS-03**: Project includes environment-based configuration for secrets and allowed origins
- [ ] **OPS-04**: Project includes deployment-ready configuration for a free hosting target
- [ ] **OPS-05**: Project documents the selected free hosting target and how to deploy to it

## v2 Requirements

### Collaboration

- **COLL-01**: Team member can view a history of previously shared documents
- **COLL-02**: Team member can manage documents through dedicated rename or delete screens

### Access

- **AUTH-03**: Team member can authenticate with individual user accounts instead of a shared token
- **AUTH-04**: Document replacement is restricted to the original uploader or owner

### Integration

- **INTG-01**: Recipient can open a shared document directly inside the main app through a deep link
- **INTG-02**: Shared documents keep version history for rollback

## Out of Scope

| Feature | Reason |
|---------|--------|
| Private viewer access controls | Shared links are intentionally public to anyone who has the URL |
| Per-user upload dashboards | The first release is focused on direct sharing, not document management |
| Edit forms for document content | Route content is authored in the existing app and shared as exported JSON |
| Document expiry / TTL | Stable links are more important than automatic cleanup in v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| DOC-01 | Phase 2 | Complete |
| DOC-02 | Phase 2 | Complete |
| DOC-03 | Phase 2 | Complete |
| DOC-04 | Phase 2 | Complete |
| DOC-05 | Phase 2 | Complete |
| DOC-06 | Phase 2 | Complete |
| SHARE-01 | Phase 3 | Pending |
| SHARE-02 | Phase 3 | Pending |
| SHARE-03 | Phase 2 | Complete |
| VIEW-01 | Phase 3 | Pending |
| VIEW-02 | Phase 3 | Pending |
| VIEW-03 | Phase 3 | Pending |
| OPS-01 | Phase 1 | Complete |
| OPS-02 | Phase 1 | Complete |
| OPS-03 | Phase 1 | Complete |
| OPS-04 | Phase 4 | Pending |
| OPS-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after preserving routeCache in shared documents*
