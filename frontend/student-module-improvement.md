## Student Module – Actionable Frontend Tasks

### 1) Workspace Shell & Navigation
- Restructure left sidebar under “Students” with routes: workspace, admissions, attendance, academics, conduct, health, documents, finance, reports.
- In Students Workspace view, lock top bar controls: global search, grade/section/status filters, view toggle (table/grid), bulk actions, primary “Add student”.
- Implement tabs within Workspace: Roster (default), Today’s Triage, Admissions Queue, Follow-Ups (stubs acceptable initially).

### 2) Roster Enhancements
- Default roster filters: Active students; include columns name, ID, class/section, guardian contact, attendance today, fee flag, alerts.
- Add status filter and bulk action hooks (take attendance, add note, export).
- Add quick-view trigger on each row (drawer stub is fine for now).

### 3) Right-Side Insight Cards (Triage Panel)
- Add cards: Alerts & Flags, Live Attendance (today), My Tasks, Active Enrollment.
- Each card should trigger a simple filter or navigation (e.g., Alerts -> flagged filter, Live Attendance -> Attendance tab).

### 4) Quick-View Drawer (Stub)
- Create reusable drawer component to show: name/photo/ID/class, guardian contact, latest attendance, fee status, flags; include quick actions (open profile, record late, add note).
- Wire from roster row action.

### 5) Student Profile Structure (Navigation Prep)
- Prepare tabs/sections matching IA: Overview, Enrollment, Attendance, Academics, Conduct, Health, Documents, Finance, Notes. Stubs acceptable; ensure routing layout supports lazy loading.

### 6) Visual/Layout Tweaks
- Keep existing dark/gold theme; ensure selected states use solid accent color (no gradients) and reduce heavy shadows.
- Tighten main content padding (already reduced in layout); ensure single scroll plane remains.

### 7) Routing & Lazy Loading (Frontend)
- Group student routes under `/students/**`; add child routes for workspace, admissions, attendance, etc.
- Mark heavy sections (finance, academics, documents, health) as lazy-loaded modules.

### 8) Accessibility & UX
- Ensure keyboard focus on search; ARIA labels on icon buttons and tabs.
- Smooth scroll behavior; custom scrollbar matches theme.

### 9) QA/Validation
- Verify filters (grade/status) and bulk select work together.
- Confirm card clicks apply filters or navigate without breaking selection state.
- Smoke test both table/grid views after changes.
