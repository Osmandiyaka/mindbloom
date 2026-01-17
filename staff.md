# Staff Profile Module Task List (MongoDB + Mongoose + Angular)

Use this checklist to track implementation of the Staff Profile module. It is organized to reuse existing work wherever possible (current staff schema, staff directory/profile pages, staff selector UI).

## Phase 0 — Foundations

- [ ] Confirm current staff data model usage and constraints in `backend/src/infrastructure/adapters/persistence/mongoose/schemas/staff.schema.ts` and `backend/src/infrastructure/adapters/persistence/mongoose/schemas/staff-attendance.schema.ts`
- [ ] Define domain entities, enums, sensitivity tiers, and lifecycle rules in a doc section below
- [ ] Map permissions to existing RBAC patterns (staff:read/create/update/archive, documents, notes, access, roles, audit)

### Domain notes (fill in as you align with backend)

- Entities: staffMember, staffEmployment, staffAssignment, staffContact, staffEmergencyContact, staffDocument, staffQualification, staffCertification, staffNote, staffUserLink, staffActivityEvent, auditLog
- Status enum: draft, pending, active, onLeave, suspended, archived, terminated
- Employment type enum: fullTime, partTime, contract, volunteer, intern
- Sensitivity tiers: normal, sensitive, restricted
- Lifecycle: soft delete via `archivedAt` + `status: archived` (no hard delete by default)

## Phase 1 — Backend data model (Mongoose)

- [x] Create new staff profile schemas (tenant-scoped, camelCase, indexed) in `backend/src/infrastructure/adapters/persistence/mongoose/schemas/`
- [x] Decide how existing `StaffSchema` maps to `staffMember` (keep/extend vs. new collection)
- [x] Implement `staffSchemaConfig` collection + defaults seeding service
- [ ] Add any required references to existing collections (schools, departments, roles, users)
- [x] Ensure tenant isolation (tenantId on all collections and indexes)

## Phase 2 — Backend APIs (REST)

- [ ] Add staff module routes/controllers/services with consistent error shape `{ code, message, details }`
- [ ] Implement list endpoint with filters, search, sorting, pagination, and `GET /api/staff/filters`
- [ ] Implement staff summary endpoint and tab subresources
- [ ] Implement staffCode suggestion + create/update with permission-gated override
- [ ] Implement duplicates check, archive impact preview, archive/restore flows
- [ ] Implement activity feed + audit log endpoints
- [ ] Add validation layer (zod/joi) and DTO mapping (camelCase)

## Phase 3 — Frontend (Angular)

Reuse existing:
- `frontend/src/app/modules/hr/pages/staff-directory/`
- `frontend/src/app/modules/hr/pages/staff-profile/`
- `frontend/libs/ui/src/lib/staff-selector/`

Tasks:
- [x] Update Staff Directory to match enterprise table + filters + right drawer workflow
- [ ] Implement Staff Detail Drawer with tabs and URL sync
- [ ] Implement Overview tab with attention flags
- [ ] Implement Employment tab (history + modals)
- [ ] Implement Assignments tab (academic year scoped)
- [ ] Implement Documents tab (verification workflow)
- [ ] Implement Notes tab (visibility options from schema endpoint)
- [ ] Implement Access & Roles tab (reuse role selector + permission tree)
- [ ] Implement Activity/Audit tab with filters and inline detail viewer

## Phase 4 — Create/Edit Staff Modals

- [ ] Create Staff modal (schema-driven required fields + duplicates warning)
- [ ] Edit Staff modal (dirty state confirm + PATCH)

## Phase 5 — Permissions + Entitlements

- [ ] Backend permission checks per endpoint
- [ ] Frontend gating with popover reasons
- [ ] Entitlements gating for Staff module nav + landing

## Phase 6 — Production Readiness

- [ ] Validation + error handling consistency
- [ ] Tests: create/update/archive impact, tenant isolation, permission enforcement
- [ ] Frontend tests: drawer tab loading, create modal validation, archive confirm flow

## Optional

- [ ] CSV import pipeline (template, mapping, preview, import summary + error report)
