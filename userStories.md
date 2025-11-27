# User Stories – Enterprise Upgrade Plan

## Admissions & Enrollment
- **Admissions workflow**: As an admissions officer, I can move applications through stages (inquiry → application → review → decision → enrolled), add review notes, scores, and waitlist/expire offers so we enforce a full admissions lifecycle.
- **One-click admit**: As an admissions officer, when I accept an applicant, the system auto-creates the student profile (with guardians), initial enrollment, and fee setup, and sends a welcome message so no re-entry is needed.
- **Communications**: As an admissions officer, I can send templated emails/SMS at key milestones (application received, interview scheduled, decision) so applicants are informed automatically.
- **Import/export with dedupe**: As an admissions officer, I can import applicants via CSV with duplicate detection and export filtered lists so onboarding scales.

## Student Profile (360°)
- **Unified profile**: As an admin/teacher, I can view a student’s 360° profile (personal, guardians, enrollment, classes, attendance, discipline, health, fees, library) in one place so I don’t navigate multiple modules.
- **Health/program flags**: As a counselor/nurse, I can record immunizations, allergies, and special program flags with proper visibility so safety/compliance is met.
- **Audit-aware edits**: As an admin, I can see who edited critical student fields and when so changes are accountable.

## Academics & Scheduling
- **Calendar/terms**: As an academic coordinator, I can define academic calendars, terms, and grading periods to anchor schedules/grades.
- **Course/sections with conflicts**: As a scheduler, I can create sections with teacher/room assignments and get conflict warnings (teacher/room/student overlaps) so timetables are clean.
- **Gradebook basics**: As a teacher, I can enter assignment scores and see calculated grades for my classes, and generate report cards/transcripts so grading is consistent.

## Attendance & Behavior
- **Daily/period attendance**: As a teacher, I can mark attendance with reasons and generate summaries/exports so compliance is met.
- **Absence alerts**: As a parent, I receive a notification when my child is marked absent/tardy so I’m informed quickly.
- **Discipline logging**: As a dean, I can log incidents, assign consequences, and track status with parent notice so behavior is managed transparently.

## Finance: Fees/Payments & Accounting
- **Invoices & payments**: As finance staff, I can create invoices with due dates/status, record payments (including online gateway), and print/send receipts so fee collection is streamlined.
- **Reminders/late fees**: As finance staff, I can configure reminders and late fees for overdue invoices so collections improve.
- **GL posting & reports**: As an accountant, I can map AR/Revenue/Cash accounts, auto-post from invoices/payments, and view trial balance/GL detail so books stay accurate.
- **Aging & exports**: As finance staff, I can view fee aging and export finance data for audits/reporting.

## HR
- **Staff lifecycle**: As HR, I can add/edit staff with full profile (employment, salary, documents, emergency contacts) and link to roles so records are complete.
- **Leave & attendance (staff)**: As HR, I can manage leave types, approve/reject requests, and track staff attendance so payroll/readiness is clear.

## Hostel
- **Hostel setup**: As hostel admin, I can create hostels, rooms, and beds with occupancy/status and assign a manager from staff so inventory is accurate.
- **Allocations**: As hostel admin, I can assign students to available beds with validation (no double booking), filter by class/gender, and end allocations so occupancy is controlled.
- **Occupancy view**: As hostel admin, I can see capacity vs. occupied/available counts per hostel/room for quick decisions.

## Library
- **Holds/fines**: As librarian, I can manage reservations/holds, overdue fines, and reminders so circulation is efficient.
- **Barcoded copies**: As librarian, I can scan barcodes to check in/out specific copies and track status so inventory stays correct.

## User Management, Security, Audit
- **RBAC/permissions UI**: As an admin, I can manage roles/permissions (module/action/field level) so access is least-privilege.
- **Audit logs**: As an admin, I can search audit trails of critical changes (students, grades, finance, roles) so compliance is satisfied.
- **SSO/MFA**: As IT, I can configure SSO and MFA for admins so security is enterprise-grade.

## Notifications & Communication
- **Event notifications**: As a user, I receive in-app/email/SMS notifications for key events (attendance, admissions decisions, fee reminders, allocations) with configurable templates so I’m always informed.
- **Announcements**: As admin, I can broadcast messages to selected roles/groups so communications are centralized.

## Dashboards & Reporting
- **Role dashboards**: As admin/teacher, I see KPIs (enrollment, attendance rate, fees due, tasks/incidents) and quick actions on login so I can act fast.
- **Reports module**: As admin, I can run standard reports (attendance, grades, fees, allocations) with filters and export to CSV/PDF; schedule recurring reports so insights are routine.
- **Global search**: As a user, I can search students/staff/records from a global bar so I navigate faster.

## Architecture & Performance
- **Event-driven integration**: As a developer, I can emit/consume domain events (admit→create student, invoice→GL, attendance→notify) so modules stay decoupled.
- **Scalability**: As a platform owner, I can paginate large lists, cache reference data, and run background jobs for heavy tasks so performance meets SLAs.

## UX & Accessibility
- **Design system**: As a user, I experience consistent theming, responsive layouts, keyboard navigation, and accessible controls so the app feels modern and inclusive.
- **Print-friendly**: As staff, I can print clean versions of invoices, profiles, and reports so offline sharing works.

## Integrations & Extensibility
- **APIs/Webhooks**: As an integrator, I can use documented APIs and webhooks for key entities/events so the system connects to LMS/SSO/payments/others.
- **Imports/exports**: As admin, I can bulk import/export students/courses/finance data (CSV/OneRoster) so data migration is easy.
