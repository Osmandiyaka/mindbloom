# Roles & Permissions v1 Task List

Goal: Deliver a production‑ready Roles & permissions module that matches the enterprise UI patterns used across Workspace Setup, with clean master/detail layout, modals for create/edit, and safe destructive flows.

## Phase 1 — Foundations & Contracts
- Verify current RBAC models and endpoints in `backend` and `frontend` (roles, permissions, users, assignments).
- Extend role metadata to support `scopeType` (workspace | school) and `status` (active | inactive) across:
  - Backend schema, entity, DTOs, use cases, and repository mapping.
  - Frontend models and service payloads.
- Align permission naming with existing `permission.constants.ts`.

## Phase 2 — Navigation & Routing
- Add “Access control” grouping under System in `frontend/src/app/shared/components/sidebar/sidebar.component.ts`.
- Add “Roles & permissions” route entry for `/roles` (existing) with RBAC/entitlement gating.
- Ensure breadcrumb/title string updates reflect “Roles & permissions”.

## Phase 3 — Roles & Permissions Page (Master/Detail)
- Replace the existing grid card list with a two‑panel layout:
  - Left: Roles list (search, filter chips, flat rows).
  - Right: Role details with badges, primary edit action, overflow menu.
- Implement role selection state and initial default selection.
- Add status pill and scope badges.

## Phase 4 — Role Actions & Safety
- Add overflow menu for role actions:
  - Duplicate
  - Deactivate/Activate
  - Delete (danger, system roles locked)
- Implement delete confirmation modal with name typing requirement.
- Enforce “system role cannot be edited/deleted” UI lock.

## Phase 5 — Create/Edit Role Modal
- Create modal for create/edit role using global modal patterns:
  - Identity (name + description)
  - Scope (workspace vs school)
  - Permissions matrix (accordion groups, search, select‑all)
- Add dirty‑state detection and confirm on close.
- Save role via `RoleService` and update list in place.

## Phase 6 — Permissions Matrix Component
- Build `PermissionMatrixComponent`:
  - Accordion groups from permission tree.
  - Group select‑all toggle and counts.
  - Search across permissions.
  - Selected permission summary.
- Provide `@Input` for selected permissions and `@Output` for updates.

## Phase 7 — Assignments Tab
- Add “Assignments” tab with a table of users assigned to the role.
- Implement “Assign users” modal:
  - User picker (search + multi‑select table).
  - Scope picker (uses AccessScopePicker).
  - Save to user updates (existing single roleId model).
- Handle empty state + CTA.

## Phase 8 — Reusable Pickers
- Build `AccessScopePickerComponent` for All schools vs Selected schools with school multi‑select.
- Reuse `RoleSelectorComponent` where appropriate.

## Phase 9 — Polish & Consistency
- Typography + spacing: H2 18–20, body 14, labels 12–13 uppercase.
- Flat list rows, subtle dividers, calm empty states.
- Ensure buttons follow primary/secondary conventions.

## Phase 10 — Validation & UX
- Validate required fields, show inline errors.
- Prevent save if unchanged.
- Ensure focus management and keyboard access in modals and menus.

## Acceptance Checks
- Sidebar shows Access control > Roles & permissions.
- Two‑panel layout renders with role selection and detail view.
- Create/edit role modal saves changes and updates list.
- Permissions matrix correctly tracks selections.
- Delete requires name confirmation and blocks system roles.
- Assignments tab loads users with role and supports reassign.

