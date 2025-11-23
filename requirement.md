```markdown
# MindBloom Cloud – SaaS School Management Platform Requirements

> **Note:** This document adapts and extends your desktop School Management System epic breakdown for a multi‑tenant SaaS + plugin‑based architecture. :contentReference[oaicite:0]{index=0}  

---

## 1. Vision & Scope

**MindBloom Cloud** is a multi‑tenant SaaS school management platform that:

- Supports **preschool through college**.
- Covers **academic, administrative, financial, and extracurricular workflows**.
- Is built on a **plugin architecture**:
  - A **Core Platform** delivers all common workflows.
  - Optional **Plugins** add specialized features (e.g., CBSE/IB marksheets, GPS transport tracking, hostel biometrics, alumni CRM, after‑school billing, national reporting).

### 1.1 Goals

- Provide a **single, extensible platform** for all school types and sizes.
- Allow schools to **install only what they need** via a plugin marketplace.
- Enable **third‑party developers** to extend the platform safely via a Plugin SDK.
- Ensure **security, scalability, and reliability** for high‑stakes educational data.

---

## 2. Core vs Plugin Responsibilities

### 2.1 Core Platform Responsibilities

The **Core** must provide:

1. **Multi‑Tenancy**
   - Tenant provisioning & onboarding.
   - Per‑tenant data isolation and configuration.
   - Tenant‑level branding, locale, currency, and academic structure.

2. **Authentication & Authorization**
   - Login, password reset, MFA, SSO (OAuth2/OIDC, SAML).
   - Role‑Based Access Control (RBAC) with permission scopes.
   - Session management, audit logging of auth events.

3. **UI Shell & Navigation**
   - Global layout (sidebar, top nav, workspace).
   - Plugin‑based navigation/menu registration.
   - Global search / command palette.

4. **Core School Workflows**
   - **Student Information System (SIS)** – core student, guardian, staff records.
   - **Admissions & Enrollment.**
   - **Academics & Scheduling** – calendar, courses, timetable.
   - **Attendance & Behavior.**
   - **Gradebook, Exams & Report Cards.**
   - **Fees, Billing & Basic Finance.**
   - **Basic HR, Library, Transport, Hostel** (minimal kernel).
   - **Messaging** – email/SMS/push abstraction and in‑app notifications.
   - **Portals** – student, parent, staff dashboards (core version).

5. **Plugin Framework & Marketplace**
   - Plugin packaging and manifest format.
   - Plugin lifecycle (install, enable, disable, upgrade, uninstall).
   - Tenant‑scoped plugin configuration and licensing.
   - Marketplace UI for discovery and installation.

6. **Shared Services**
   - Notification service.
   - File/document storage service.
   - Reporting and analytics base layer.
   - Background jobs / scheduler.
   - API gateway and webhooks.

### 2.2 Plugin Responsibilities

Plugins **must not** reimplement platform concerns (auth, tenancy, RBAC). Plugins may:

- Introduce **new domains** (e.g., Alumni CRM, Advanced Behaviour, Online Exams Pro).
- Extend existing modules with **special rules or workflows** (e.g., country‑specific transcript formats, curriculum standards).
- Provide **integrations** with third‑party systems (LMS, ERP, payroll, payment gateways, SMS/WhatsApp/email providers).
- Add **frontend extensions**:
  - Dashboard widgets.
  - Additional menu sections.
  - Extra tabs/panels on core screens (e.g., “AI Insights” on student profile).
- Register **event handlers** for platform events (e.g., `student.enrolled`, `invoice.paid`).

Plugins are:

- **Tenant‑scoped** – each tenant can choose which plugins to enable.
- **Versioned** with semantic versioning and compatibility declarations.
- Sandboxed with **explicitly declared permissions**.

---

## 3. User Roles & Permissions

### 3.1 Global Roles

- **Platform Super Admin (SaaS Owner)**
  - Creates tenants, manages global settings & marketplace.
- **Tenant Owner / Group Admin**
  - Manages one or more schools under a tenant.
  - Oversees billing, plugin subscriptions, and global tenant policies.

### 3.2 School‑Level Roles

- **School Administrator**
  - School‑wide configuration, SIS, fees, staff, plugins at school scope.
- **Academic Coordinator / HOD / Principal**
  - Curriculum, classes, subject assignments, exam setup and approvals.
- **Teacher / Faculty**
  - Class‑level academics: attendance, assessments, grades, feedback.
- **Non‑Teaching Staff**
  - Finance Officer, HR Manager, Librarian, Transport Manager, Hostel Warden, Counselor, Front Office.
- **Student**
  - Timetable, assignments, grades, fees, messages, self‑service forms.
- **Parent / Guardian**
  - Child’s attendance, grades, payments, announcements, meetings.
- **IT / Integrations Admin**
  - SSO, API keys, webhooks, integration plugins.

### 3.3 Permission Model

- **Permissions** are granular scopes, e.g.:
  - `students:read`, `students:edit`, `fees:invoice:create`, `attendance:mark`, `reports:export`.
- **Roles** are collections of scopes; default role templates:
  - Student, Parent, Teacher, School Admin, Finance Officer, etc.
- **Plugin Scopes**:
  - Plugins declare scopes like `transport:gps:view`, `hr:payroll:run`.
  - Tenant admins must explicitly grant these during plugin installation.
- **Field‑level security** for sensitive fields (health, SPED flags, discipline).
- All checks enforced both in **UI** (hide/disable) and **API** (403).

---

## 4. Epics & Functional Requirements

> Epics are grouped logically and aligned with your desktop epic breakdown, adapted for SaaS + plugins. :contentReference[oaicite:1]{index=1}  

Each epic includes a **Core responsibility** and **Plugin extension** view, plus sample user stories with acceptance criteria (AC).

---

### EPIC P1 – Platform & Plugin Framework

#### P1.1 Tenant Management (Core)

- Provision new tenants with:
  - Name, domain/subdomain, region, currency, default academic model.
- Manage lifecycle:
  - Activate, suspend, archive, delete.
- Tenant branding:
  - Logo, primary/secondary colors, theme, login background.
- Tenant settings:
  - Locale, time zone, first day of week, academic levels (K‑12, college).

**User Story P1.1‑1 — Create Tenant**

- *As a platform admin I can create a new tenant so a new school can onboard.*
- **AC:**
  - I can enter tenant metadata and select a subscription plan.
  - System allocates URL (e.g., `schoolcode.mindbloom.app`) and creates a Tenant Admin user.
  - Tenant has isolated data and cannot see other tenants’ records.

#### P1.2 Plugin Marketplace & Lifecycle (Core)

- Marketplace list with filters (category, price, rating, compatibility).
- Per‑plugin detail page.
- Install, enable, disable, update, uninstall flows.
- Plugin manifest validation and compatibility checks.

**User Story P1.2‑1 — Install Plugin**

- *As a tenant admin, I can install “Advanced Transport GPS” from the marketplace.*
- **AC:**
  - Detail page shows required permissions and compatible plan.
  - After I confirm, plugin moves to “Installed” with status Enabled.
  - New menu items/routes registered; plugin config screen is accessible.

**User Story P1.2‑2 — Disable Plugin**

- *As a tenant admin, I can temporarily disable a plugin without losing its data.*
- **AC:**
  - When disabled, plugin menus and routes are hidden.
  - Plugin event handlers are inactive.
  - Plugin data remains in storage; re‑enabling restores full functionality.

---

### EPIC P2 – Tenant Admin & System Configuration

#### P2.1 System Settings (Core)

- Academic year/term setup.
- Grading schemes and scales.
- Custom fields (student, staff, class, invoice).
- Codes/tags lists (e.g., reasons, statuses).

**User Story P2.1‑1 — Configure Academic Year**

- *As a school admin, I can configure academic years and terms.*
- **AC:**
  - I can add Year `2024–2025` with Term 1 and Term 2 (start/end dates).
  - Overlapping dates are rejected.
  - Calendar is used by academics, exams, and fees modules.

#### P2.2 User & Role Management (Core)

- Create/edit users and assign roles.
- Custom role creation:
  - Toggle permissions (core + plugin).
- Bulk import of users (CSV).

**User Story P2.2‑1 — Custom Role**

- *As a tenant admin I can create a “Grade Level Coordinator” role.*
- **AC:**
  - I can select permissions such as `students:read`, `attendance:view`, `grades:view` for assigned grades.
  - Users with that role see only assigned classes/grades.

---

### EPIC S3 – Student Information System (SIS) – Core

#### S3.1 Student Profile & Enrollment

- Create and maintain student records:
  - Demographics, guardians, contact info, documents.
- Enrollment:
  - Admission year, program, grade, section, status (Active/Alumni).

**User Story S3.1‑1 — Create Student**

- *As an admin I can create a new student profile.*
- **AC:**
  - Required fields (name, DOB, primary contact) validated.
  - System generates Student ID and login (if portal access enabled).
  - Student appears in search and class assignment immediately.

#### S3.2 Guardian & Contacts

- Multiple guardians with relationships.
- Emergency contacts.
- Preferred communication channel per guardian.

**Plugin Extensions**

- Health / clinic module.
- SPED/IEP management.
- ID card & certificate generator.

---

### EPIC A4 – Admissions & Enrollment

#### A4.1 Inquiry & Applications (Core)

- Public forms for inquiry and application (school‑branded).
- Pipeline: Inquiry → Application → Review → Decision → Enrolled.
- Document uploads.

**User Story A4.1‑1 — Submit Application**

- *As a parent I can submit an online application for my child.*
- **AC:**
  - I can save a draft and resume later.
  - Required fields are validated inline.
  - On submit, I receive confirmation email and see status “Submitted”.

#### A4.2 Review & Decision (Core)

- Committee review dashboard.
- Decision types:
  - Offer, Waitlist, Reject.
- Offer letter template and email.

#### A4.3 Enrollment Conversion (Core)

- One‑click “Enroll” to:
  - Create student + guardian records.
  - Assign default fee plan and class.

**Plugin Extensions**

- Advanced CRM (funnels, campaigns).
- Integration with marketing tools.
- Interview scheduling and scoring rubrics.

---

### EPIC AC5 – Academics & Scheduling

#### AC5.1 Academic Calendar & Curriculum (Core)

- Academic years & terms.
- Course catalog (with credits, level, subject).
- Mapping courses to grades/programs.

#### AC5.2 Classes & Sections (Core)

- Create class sections (e.g., Grade 4A).
- Assign homeroom teacher.
- Enroll students and assign subject teachers.

#### AC5.3 Timetable (Core)

- Define periods, days, and cycle patterns.
- Generate timetables per class and teacher.
- Conflict detection.

**User Story AC5.3‑1 — Generate Timetable**

- *As scheduler I can auto‑generate timetables.*
- **AC:**
  - I can set constraints like “max 6 periods/day” and “no double Maths on Monday”.
  - Generated timetable is conflict‑checked.
  - I can manually adjust and publish to teachers/students.

**Plugin Extensions**

- AI optimization for timetables.
- National curriculum presets.

---

### EPIC AT6 – Attendance & Behavior

#### AT6.1 Attendance (Core)

- Period or daily attendance.
- Statuses: Present, Absent, Late, Excused.
- Bulk marking & offline caching (for mobile apps).

**User Story AT6.1‑1 — Mark Attendance**

- *As a teacher, I can quickly mark attendance for my class.*
- **AC:**
  - Class list auto-loads; I can mark all as present then change exceptions.
  - Saving updates daily stats and triggers absence rules.

#### AT6.2 Notifications (Core)

- Rules for sending parent alerts on absence/tardiness.
- Configurable channels (email, SMS, push).

#### AT6.3 Behavior (Core/Plugin)

- Incident log with categories, severity, actions.
- Parent communication log.
- Counselor referrals.

---

### EPIC GR7 – Gradebook, Exams & Report Cards

#### GR7.1 Gradebook (Core)

- Spreadsheet‑style per class.
- Categories & weights.
- Final grade calculation.

**User Story GR7.1‑1 — Enter Grades**

- *As a teacher I can enter grades for an assignment.*
- **AC:**
  - Grid supports keyboard navigation.
  - Auto‑save or save button; changes persisted reliably.
  - Averages and final grades auto‑recalculate.

#### GR7.2 Exams (Core)

- Exam definitions, schedules.
- Marks entry and moderation.
- Pass/fail thresholds.

#### GR7.3 Report Cards (Core)

- Template system for term reports.
- PDF generation and portal publishing.

**Plugin Extensions**

- Standards‑based grading.
- National exam integrations.
- Online exam and proctoring.

---

### EPIC F8 – Fees, Billing & Payments

#### F8.1 Fee Plans & Assignments (Core)

- Define fee categories and plans.
- Assign to students (by grade, program, or individually).

#### F8.2 Invoicing (Core)

- Generate one‑time or recurring invoices.
- Payment schedules and due dates.
- Aging and summary reports.

#### F8.3 Payments (Core)

- Record payments (cash, cheque, bank transfer).
- Apply to invoices and track balances.

**User Story F8.3‑1 — Parent Pays Online**

- *As a parent, I can pay fees online from the portal.*
- **AC:**
  - I see outstanding invoices and select one or more to pay.
  - I am redirected to payment gateway; returning success updates invoice as paid and issues a receipt.
  - Failed payment is recorded and visible with error status.

**Plugin Extensions**

- Payment gateways (Stripe, PayPal, local bank).
- Mobile money integrations.
- Dunning workflows and automated reminders.
- Full ERP integration.

---

### EPIC FE9 – Finance ERP (Plugin‑Heavy)

- GL accounts, vendors, budgets, bank reconciliation, assets.
- Sync postings from fees and payroll.

---

### EPIC HR10 – HR & Payroll

#### HR10.1 Staff Records (Core)

- Employee profiles: personal data, job details, contracts.

#### HR10.2 Leave & Attendance (Core)

- Leave types, balances, approval workflows.
- Timesheets (optional core; advanced in plugins).

#### HR10.3 Payroll (Plugin)

- Salary structures, allowances, deductions.
- Payroll runs and payslips.
- Integration with statutory tax/pension systems.

---

### EPIC LIB11 – Library & Inventory

#### LIB11.1 Library (Core)

- Book catalog with copies.
- Issue/return, renewals, fines.

#### LIB11.2 Inventory (Plugin)

- Non‑book asset tracking (IT equipment, labs).
- Maintenance schedules, depreciation.

---

### EPIC TR12 – Transport & Safety

#### TR12.1 Transport (Core)

- Vehicles, drivers, routes, stops.
- Assign students to routes.

#### TR12.2 Safety & Tracking (Plugin)

- GPS tracking, route replay.
- Driver mobile app.
- Parent ETA view and alerts.

---

### EPIC H13 – Hostel/Residence (Plugin)

- Hostel blocks, rooms, beds.
- Room allocation, check‑in/out.
- Visitor logs, conduct logs.
- Meal plans, maintenance requests.

---

### EPIC C14 – Communications & Engagement

#### C14.1 Messaging Hub (Core)

- Compose messages to roles/groups/filters.
- Channels: in‑app, email, SMS (via connectors).

#### C14.2 Engagement (Plugins)

- Scheduled campaigns.
- Surveys and feedback forms.
- Parent–teacher meeting scheduler.

---

### EPIC R15 – Reporting & Analytics

#### R15.1 Operational Reports (Core)

- Attendance statistics.
- Grade distribution per class.
- Fee collection & outstanding.

#### R15.2 Advanced Analytics (Plugins)

- Custom report builder.
- Predictive analytics (risk of dropout, performance trends).
- BI integrations (Power BI, Looker).

---

### EPIC API16 – API & Integrations

#### API16.1 Platform APIs (Core)

- REST/GraphQL endpoints for core entities.
- OAuth2 client credentials for server‑to‑server integrations.
- Rate limiting and API keys.

#### API16.2 Webhooks (Core)

- Tenant‑configurable webhooks for platform events.

#### API16.3 Integration Plugins

- LMS, SIS, ERP, SMS, email, SSO connectors implemented as plugins.

---

### EPIC M17 – Plugin Marketplace & Management

- Marketplace UI per tenant.
- Plugin install/enable/disable/update/uninstall.
- Version compatibility checks.
- License and billing integration.

---

## 5. Non‑Functional Requirements

### 5.1 Scalability & Performance

- Horizontally scalable stateless API servers.
- P95 API response:
  - < 300 ms for typical CRUD operations.
  - < 1 s for list views with pagination.
- Async/background processing for heavy tasks (reports, PDFs, imports).
- Caching of reference data per tenant.

### 5.2 Availability & Reliability

- 99.9% uptime target.
- Blue‑green or rolling deployments.
- Automated backups:
  - Daily full + frequent incrementals.
  - Per‑tenant restore.

### 5.3 Security

- Strong tenant isolation at all layers.
- TLS everywhere; encryption at rest for DB and storage.
- RBAC enforcement on every endpoint.
- CSRF/XSS/SQLi/IDOR protections.
- Plugin sandboxing:
  - Plugins access data only through platform services with permission checks.
  - No arbitrary direct DB access.
- Audit trails for:
  - Logins and auth changes.
  - Data changes on sensitive entities.
  - Plugin installation and configuration changes.

### 5.4 Compliance

- Controls to support FERPA/GDPR/COPPA‑style privacy:
  - Consent management.
  - Right to access/export/delete personal data.
  - Configurable data retention and anonymization.

### 5.5 UX & Accessibility

- Consistent design system (cards, buttons, typography, spacing).
- Responsive (desktop‑first, tablet‑friendly; simplified mobile for portals).
- WCAG 2.1 AA compliance for core flows.

---

## 6. Multi‑Tenancy, Customization & Extensibility

### 6.1 Multi‑Tenancy

- Tenant isolation via:
  - `tenant_id` column + row‑level security, or
  - separate schemas/DBs for large or regulated tenants.
- Tenant‑level configuration: branding, themes, feature toggles, plugins.

### 6.2 Customization

- Custom fields on key entities (student, staff, class, invoice).
- Custom validation and approval workflows (via plugin or rules engine).
- Theming options and custom CSS (within safe boundaries).

### 6.3 Extensibility

- Public APIs & webhooks.
- Plugin SDK (see section 7).
- Extension points:
  - Navigation, dashboards, entity detail panels, actions.
  - Event bus for domain events.

---

## 7. Plugin SDK – Specification Requirement

> **Deliverable Requirement:** The platform team **must produce a Plugin SDK specification** covering interfaces, manifest schema, and event contracts for the Node/NestJS + Angular stack.

At a high level this SDK spec must define:

- **Backend Interfaces (NestJS)**  
  - Base `PluginModule` interface with lifecycle hooks (`onInstall`, `onEnable`, `onDisable`, `onUpgrade`, `onUninstall`).  
  - Access interfaces for:
    - Tenant context (tenant ID, school IDs).
    - Data services (SIS, fees, attendance, etc.) restricted by scopes.
    - Event bus publishers/subscribers.
    - Configuration & secrets (per‑tenant settings, API keys).
  - Error handling & logging conventions.

- **Frontend Interfaces (Angular)**  
  - API for registering:
    - Routes and lazy modules.
    - Sidebar/top‑nav items and icons.
    - Dashboard widgets.
    - Entity detail extensions (e.g., extra tabs on Student profile).
  - Design system components and styling guidelines.

- **Manifest Schema**  
  - Fields:
    - `id`, `name`, `description`, `version`, `provider`.
    - `platformVersionRange`.
    - `permissions` required (scopes).
    - `extensionPoints` used (menus, dashboards, profile panels, settings pages).
    - `eventsSubscribed` and `eventsPublished`.
    - Optional dependencies on other plugins.
  - JSON schema document and validation rules.

- **Events & Event Bus Contracts**  
  - Canonical event names and payload shapes, e.g.:
    - `student.created`, `student.updated`, `student.enrolled`.
    - `attendance.marked`, `grade.published`.
    - `invoice.created`, `payment.received`.
  - Delivery semantics (at least once; idempotency recommendations).
  - Tenant and user context in every event.

- **Distribution & Security Guidelines**  
  - Packaging format (npm packages or signed archives).  
  - Code signing and integrity checks.  
  - Security review checklist for marketplace submission.

This SDK specification should be published as a separate developer‑facing document and kept versioned alongside platform releases.

---

## 8. Key Workflow Overviews (Text)

### 8.1 Admissions → Enrollment

1. Parent/student submits application online.
2. System records application and sends confirmation.
3. Admissions staff triage and review; may request documents.
4. Decision recorded (Offer / Waitlist / Reject).
5. If offer:
   - Offer letter generated.
   - Parent accepts and pays admission fee (optional plugin).
6. System creates student & guardians, assigns class & fee plan.
7. Welcome message and checklist triggered.

### 8.2 Daily Teacher Workflow

1. Teacher logs in; dashboard shows today’s classes, pending grading, alerts.
2. Opens first class:
   - Marks attendance.
   - Notes behavior/incident if needed.
3. Later in the day:
   - Creates assignment and records grades.
4. End of day:
   - Sees summary of attendance and grading tasks.

### 8.3 Fees & Payments Workflow

1. Finance sets up fee plans for each grade.
2. At term start, invoices generated for all enrolled students.
3. Parents see invoices via portal/email.
4. Parents pay online or offline; payments posted and reconciled.
5. Reminders sent for overdue invoices.
6. Summary reports and analytics fed into finance/ERP plugins.

---

## 9. Conclusion

This Markdown document:

- Defines **core vs plugin responsibilities**.
- Details **user roles**, **epics**, and **key user stories** with acceptance criteria.
- Specifies **non‑functional constraints** and **multi‑tenant considerations**.
- Explicitly requires a **Plugin SDK specification** for Node/NestJS + Angular (interfaces, manifest schema, events) as a separate deliverable.

You can now:

- Commit this as a `requirements.md` in your repo.
- Use each epic as a roadmap section in Jira/Azure DevOps.
- Use the Plugin SDK requirement to drive the next design phase for the extension model.
```
