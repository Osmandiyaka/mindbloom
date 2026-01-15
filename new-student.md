# Student Module Redesign - Task List

- [x] Audit current Students module routes, pages, and shared components to align with the new 2-panel directory + detail model.
- [x] Define data model and interfaces for Students directory (columns, filters, saved views, bulk actions).
- [x] Build Students Directory layout with custom components (header, search, filters, table, bulk bar, pagination).
- [x] Implement row selection + right-side detail panel with deep-link support (`?studentId=`).
- [x] Add overflow row actions (edit, transfer, promote, archive/restore) with permission/entitlement gating.
- [x] Implement Add Student split button + create modal (manual) and Import CSV entry (wizard stub).
- [x] Add empty, loading, and error states using enterprise-safe copy and styling.
- [x] Implement keyboard navigation (up/down, enter to open, esc to close).
- [x] Build Student Detail tabs (Overview, Enrollment & Classes, Guardians, Documents, Access & Accounts, Audit Log).
- [x] Add bulk action workflows with impact counts and typed confirmation for destructive actions.
- [x] Wire permissions/entitlements to all actions and use the new lock/gated patterns.
- [x] Add analytics/audit hooks for create/archive/transfer/bulk operations.
