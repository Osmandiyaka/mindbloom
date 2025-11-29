# Admissions Frontend Implementation Plan

## Milestones & Order
1) Foundation & routing
   - Set up `/admissions` (staff) + `/apply` (public) routes with lazy loading and guard stubs.
   - Create base layouts: StaffAdmissionLayout (sidebar/topbar) and PublicAdmissionLayout.
   - Shared theme tokens for admission pages (spacing, gradients for stat icons, badges, tables).
2) Staff dashboard & analytics
   - Admission Dashboard page (stat cards, quick actions, activity timeline, hover/animation polish; mocked data + polling).
   - Admissions analytics dashboard (chart grid + filters; mock data).
3) Walk-in admission flow
   - Stepped walk-in form (Material stepper), sidebar summary, validation, auto-save hooks.
   - Supporting components: QuickAdmissionForm, Document checklist, Class assignment, Payment collection, Completion summary (mock data).
4) Online applications (staff)
   - Online Application List: filterable/sortable/virtualized table, filters bar, bulk actions, summary bar, hover preview, pagination (mock data).
   - Application Review page: split layout with tabs (details/docs/history/comms) + review form, sticky actions, doc viewer modal, auto-save (mock data).
5) Public application flow (/apply)
   - Public wizard (start/personal/academic/docs/review/submit) with progress, auto-save indicator, help sidebar (mock persistence).
   - Public prospectus/eligibility/help pages.
6) Prospectus & inventory (staff)
   - Prospectus sell and inventory views (tables/forms, mock data).
7) Reports
   - Daily / Collection / Conversion reports: filters + tables/cards (mock data).
8) Settings
   - Rounds, Criteria, Templates pages: forms/tables; template editor placeholder.
9) Shared components
   - AdmissionStatsWidget, DocumentUploader (drag-drop, previews), FeeCalculator (breakdown + chart), StatusTimeline.
   - Reuse PermissionTreeSelector / role selector where needed.
10) Services & state (mock-first)
    - AdmissionService stub (walk-in/online ops, uploads, reports with mock responses).
    - AdmissionStateService for wizard state (BehaviorSubjects, completion %, auto-save queue).
11) Guards, responsive, accessibility
    - Guard stubs: AdmissionRoleGuard, ApplicationOwnerGuard, AdmissionPeriodGuard, FormCompletionGuard.
    - Responsive patterns for tables-to-cards, mobile bottom nav; WCAG basics (focus, aria labels, skip links, contrast).
12) Performance hooks
    - Verify lazy loading, virtual scroll on heavy lists, debounced search/auto-save, memoization where helpful.

## Quick Start Task Order
- Step 1: Routing + layouts (Staff/Public) + shared theme tokens.
- Step 2: Admission Dashboard page (mocked data/polling).
- Step 3: Walk-in flow scaffolding (stepper, summary, validation) with mock data.
- Step 4: Online Application List table (filters, bulk actions, pagination) with mock data.
- Step 5: Application Review split view (details + review form, doc viewer placeholder).
- Step 6: Public wizard shell with steps and progress; mock persistence.
- Step 7: Shared components (Uploader, FeeCalculator, Timeline).
- Step 8: Reports/Settings/Prospectus pages with simple UI + mock data.
- Step 9: Polish (responsive, accessibility, performance patterns).

## Mocking Guidance
- Use hard-coded JSON/services for initial UIs; swap to real APIs later.
- Define interfaces up front (DashboardStats, Activity, GradeAvailability, PaymentMode, WalkInAdmission, PaymentRecord, DocumentStatus, ApplicationListItem, FilterCriteria, DetailedApplication, Review, ApplicationForm, etc.).
- Keep API service methods with mock implementations to ease integration.

## Design Notes
- Stat/CTA icons on gradients; consistent card padding and hover lift.
- Tables: zebra rows on heavy lists; sticky headers on scroll; badges for statuses.
- Forms/wizards: inline validation, progress indicators, “save as draft” affordance.
- Primary theme for key actions; quiet secondary/ghost for less prominent actions.
- Ensure keyboard navigation and focus states are visible; aria-label all icon buttons.
