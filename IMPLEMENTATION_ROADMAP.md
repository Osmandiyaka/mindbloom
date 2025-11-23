# 🗺️ MindBloom Cloud - Implementation Roadmap

> **Created:** Based on `requirement.md` (718 lines, 17 EPICs)  
> **Current Branch:** `planning/application-roadmap`  
> **Status:** Planning Phase

---

## 📊 Current State Analysis

### ✅ What's Implemented (Foundation)

#### Multi-Tenancy Infrastructure (EPIC P1 - Partial)
- ✅ Backend: `TenantContext`, `TenantGuard`, `@Public()` decorator
- ✅ Backend: Tenant schemas with `tenantId` compound indexes
- ✅ Backend: `TenantController` with GET `/tenants/code/:code`, POST `/tenants`
- ✅ Backend: `MongooseTenantRepository` with hexagonal architecture
- ✅ Frontend: `TenantService` with signal-based state management
- ✅ Frontend: Tenant HTTP interceptor for adding `x-tenant-id` header
- ✅ Frontend: Beautiful inline tenant selector with validation
- ✅ Frontend: Full tenant registration modal (4 plan tiers)
- ✅ Test Scripts: `create-test-tenant.js`, `create-test-user.js`
- ✅ Tenant persistence in localStorage across logout

#### Authentication (EPIC P2 - Partial)
- ✅ JWT-based authentication with `tenantId` in token
- ✅ Login overlay with auto-show functionality
- ✅ Auth guards and HTTP interceptors
- ✅ Passport strategies (Local + JWT)
- ✅ Logout preserves tenant selection

#### Student Management (EPIC S3 - Partial)
- ✅ Full hexagonal architecture: Domain, Application, Infrastructure layers
- ✅ Use cases: Create, GetAll, GetById, Update, Delete
- ✅ `MongooseStudentRepository` with tenant isolation
- ✅ Student controller with CRUD endpoints
- ✅ Frontend: Student list and detail views (basic UI)

#### UI/UX Foundation
- ✅ QuickBooks-style workflow dashboard
- ✅ Global toolbar with logout
- ✅ Design system: Colors, typography, spacing, shadows
- ✅ Reusable components: Button, Card, Hero, StatCard, Badge, Modal, Sidebar
- ✅ SCSS theme system with mixins
- ✅ Responsive layout foundation

### ⚠️ Scaffold-Only Modules (No Business Logic)

These modules have **controller/service/module files only** - no domain layer, no use cases, no real implementation:

- ⚠️ Academics (controller + service stub)
- ⚠️ Attendance (controller + service stub)
- ⚠️ Fees (module only)
- ⚠️ Finance (module only)
- ⚠️ HR (controller + service stub)
- ⚠️ Payroll (controller + service stub)
- ⚠️ Library (controller + service stub)
- ⚠️ Hostel (controller + service stub)
- ⚠️ Transport (controller + service stub)
- ⚠️ Setup (controller + service stub)

### ❌ Not Started (Per Requirements)

- ❌ **Plugin Framework** (EPIC P1.2) - Core architecture requirement
- ❌ **Plugin SDK** - NestJS + Angular interfaces, manifest schema, event bus
- ❌ **Plugin Marketplace** (EPIC M17)
- ❌ **Tenant self-service portal** (EPIC P2.1)
- ❌ **Role-Based Access Control (RBAC)** beyond basic auth
- ❌ **Admissions workflow** (EPIC A4)
- ❌ **Academic scheduling** (EPIC AC5)
- ❌ **Attendance tracking** (EPIC AT6)
- ❌ **Gradebook/Exams** (EPIC GR7)
- ❌ **Fee billing & payments** (EPIC F8)
- ❌ **Finance ERP** (EPIC FE9)
- ❌ **HR & Payroll** (EPIC HR10)
- ❌ **Library management** (EPIC LIB11)
- ❌ **Transport & Safety** (EPIC TR12)
- ❌ **Hostel management** (EPIC H13)
- ❌ **Communications** (EPIC C14)
- ❌ **Reporting & Analytics** (EPIC R15)
- ❌ **API & Integrations** (EPIC API16)

---

## 🎯 Implementation Strategy

### Core Principles

1. **Plugin-First Architecture**: Build plugin framework BEFORE functional modules
2. **Hexagonal Architecture**: Maintain domain-driven design across all modules
3. **Multi-Tenancy by Default**: Every entity has `tenantId`, every query filtered
4. **Progressive Enhancement**: Core features first, plugins extend functionality
5. **API-First Design**: Backend complete before frontend implementation

---

## 📅 Phased Roadmap

### 🟦 **Phase 1: Platform Foundation** (4-6 weeks)

**Objective:** Complete core platform infrastructure to support plugins and multi-tenancy

#### 1.1 Plugin Framework (EPIC P1.2) - **CRITICAL**
**Priority:** P0 - Blocker for all functional modules

**Backend Tasks:**
- [ ] Define `IPlugin` interface with lifecycle hooks (onInstall, onEnable, onDisable)
- [ ] Create `PluginLoader` service with dynamic module loading
- [ ] Implement `PluginRegistry` with installed plugins tracking
- [ ] Build plugin manifest schema (`plugin.json`) with metadata, permissions, dependencies
- [ ] Create plugin event bus for inter-plugin communication
- [ ] Add plugin storage isolation (database + file storage)
- [ ] Implement plugin health checks and monitoring

**Frontend Tasks:**
- [ ] Define Angular plugin extension points (routes, menu items, dashboard widgets)
- [ ] Create `PluginService` for runtime plugin injection
- [ ] Build plugin component loader with lazy loading
- [ ] Implement plugin menu registry
- [ ] Add plugin settings UI framework
- [ ] Create plugin permissions UI

**Acceptance Criteria:**
- Sample "HelloWorld" plugin can be installed/enabled/disabled
- Plugin can add menu item and route dynamically
- Plugin has isolated database schema (e.g., `{tenantId}_{pluginId}_tablename`)
- Plugin can publish/subscribe to events

---

#### 1.2 Enhanced RBAC System (EPIC P2.2)
**Priority:** P0 - Required for all modules

**Backend Tasks:**
- [ ] Create `Role` entity (SuperAdmin, TenantAdmin, Principal, Teacher, Student, Parent, etc.)
- [ ] Create `Permission` entity with resource-based permissions
- [ ] Implement `RoleRepository` with tenant isolation
- [ ] Build `PermissionGuard` decorator for endpoint protection
- [ ] Create use cases: AssignRole, RevokeRole, CreateCustomRole
- [ ] Add permission inheritance (e.g., TenantAdmin inherits Teacher permissions)

**Frontend Tasks:**
- [ ] Role management UI (list, create, edit roles)
- [ ] Permission matrix UI (checkbox grid for role-permission mapping)
- [ ] User role assignment UI
- [ ] `hasPermission` directive for UI element visibility

**Acceptance Criteria:**
- Can create custom role "Librarian" with specific permissions
- Teacher can only see their own classes
- Parent can only see their children's data

---

#### 1.3 Tenant Self-Service Portal (EPIC P2.1)
**Priority:** P1

**Tasks:**
- [ ] Tenant settings page (school name, logo, timezone, academic calendar)
- [ ] User invitation system (send invite emails, role selection)
- [ ] Subscription management UI (plan upgrade/downgrade)
- [ ] Billing information page (view invoices, update payment method)
- [ ] Usage dashboard (storage used, user count, API calls)
- [ ] Plugin marketplace browser (install/uninstall plugins)

**Acceptance Criteria:**
- Tenant admin can upload school logo
- Can invite users with pre-assigned roles
- Can upgrade from Free to Premium plan

---

#### 1.4 Audit Logging (Non-Functional Requirement)
**Priority:** P1

**Tasks:**
- [ ] Create `AuditLog` entity (userId, tenantId, action, resource, timestamp, oldValue, newValue)
- [ ] Implement `@Auditable()` decorator for auto-logging
- [ ] Build audit log repository with retention policies
- [ ] Create audit log viewer UI with filters
- [ ] Add compliance report exports (FERPA/GDPR)

---

### 🟩 **Phase 2: Core School Operations** (8-10 weeks)

**Objective:** Implement essential school management features using hexagonal architecture

#### 2.1 Student Information System - Complete (EPIC S3)
**Priority:** P0 - Foundation for all other modules

**Backend Tasks:**
- [ ] Extend `Student` entity with full fields (demographics, medical info, emergency contacts)
- [ ] Create `Guardian` entity with relationship to students
- [ ] Create `StudentDocument` entity (birth certificates, photos, medical records)
- [ ] Implement bulk student import (CSV/Excel)
- [ ] Add student search with filters (class, status, enrollment date)
- [ ] Create student promotion workflow (move to next grade)
- [ ] Build student transfer use case (between sections/classes)

**Frontend Tasks:**
- [ ] Complete student registration form with multi-step wizard
- [ ] Student profile page with tabs (Info, Guardians, Documents, History)
- [ ] Guardian management (add/edit/remove guardians)
- [ ] Document upload with preview
- [ ] Student search with advanced filters
- [ ] Bulk actions (promote, transfer, archive)

**Acceptance Criteria:**
- Can register student with 2 guardians
- Can upload PDF birth certificate
- Search "Grade 10, Section A, Active" returns correct students

---

#### 2.2 Admissions & Enrollment (EPIC A4)
**Priority:** P0

**Backend Tasks:**
- [ ] Create `Application` entity (status: Submitted, UnderReview, Accepted, Rejected)
- [ ] Create `ApplicationWorkflow` for approval routing
- [ ] Implement online application form submission
- [ ] Build application review use case (principal approves/rejects)
- [ ] Create automated enrollment use case (convert Application → Student)
- [ ] Add application fee tracking

**Frontend Tasks:**
- [ ] Public application form (parent-facing, no login required)
- [ ] Application review dashboard (list pending applications)
- [ ] Application detail view with approval/rejection actions
- [ ] Bulk application processing

**Acceptance Criteria:**
- Parent can submit application for Grade 1
- Principal sees notification for new application
- Approved application auto-creates student record

---

#### 2.3 Academics & Scheduling (EPIC AC5)
**Priority:** P0

**Backend Tasks:**
- [ ] Create `AcademicYear` entity (start/end dates, current flag)
- [ ] Create `Term` entity (semesters/quarters)
- [ ] Create `Subject` entity with teacher assignment
- [ ] Create `Class` entity (grade + section, e.g., "Grade 10-A")
- [ ] Create `Timetable` entity (period scheduling)
- [ ] Create `ClassRoom` entity for room allocation
- [ ] Implement timetable conflict detection

**Frontend Tasks:**
- [ ] Academic year management (create, set current)
- [ ] Class creation wizard (assign subjects, teachers, students)
- [ ] Timetable builder (drag-drop interface)
- [ ] Weekly timetable view (teacher + student views)
- [ ] Classroom allocation UI

**Acceptance Criteria:**
- Can create "2024-2025" academic year with 3 terms
- Timetable prevents scheduling "Math" and "Science" at same time for same teacher

---

#### 2.4 Attendance Tracking (EPIC AT6)
**Priority:** P0

**Backend Tasks:**
- [ ] Create `Attendance` entity (studentId, date, status: Present/Absent/Late, remarks)
- [ ] Create bulk attendance recording use case
- [ ] Implement attendance report generation (monthly, by student, by class)
- [ ] Add attendance alerts (e.g., 3 consecutive absences)
- [ ] Create leave request workflow (parent submits, teacher approves)

**Frontend Tasks:**
- [ ] Daily attendance sheet (class roster with checkboxes)
- [ ] Bulk mark present/absent buttons
- [ ] Attendance reports (charts, export to PDF/Excel)
- [ ] Leave request form (parent portal)
- [ ] Attendance alerts dashboard

**Acceptance Criteria:**
- Teacher marks attendance for 40 students in under 2 minutes
- Parent receives notification if child absent
- Monthly attendance report shows 95% attendance rate

---

#### 2.5 Gradebook, Exams & Report Cards (EPIC GR7)
**Priority:** P1

**Backend Tasks:**
- [ ] Create `Exam` entity (name, date, total marks, subjects)
- [ ] Create `ExamResult` entity (studentId, examId, subjectId, marksObtained)
- [ ] Create `GradeScale` entity (A+: 90-100, A: 80-89, etc.)
- [ ] Implement grade calculation with weightage (midterm 40%, final 60%)
- [ ] Build report card generator (PDF with school logo, signature)
- [ ] Add rank calculation (class rank, overall rank)

**Frontend Tasks:**
- [ ] Exam creation form (assign subjects, dates, marks distribution)
- [ ] Marks entry grid (spreadsheet-like interface)
- [ ] Student report card view (with download PDF button)
- [ ] Grade analytics dashboard (subject-wise average)

**Acceptance Criteria:**
- Can create "Midterm Exam 2024" with 6 subjects
- Marks entry auto-calculates grade and rank
- Report card PDF includes school logo and principal signature

---

### 🟨 **Phase 3: Financial & Administrative** (6-8 weeks)

#### 3.1 Fees, Billing & Payments (EPIC F8)
**Priority:** P1

**Backend Tasks:**
- [ ] Create `FeeStructure` entity (tuition, transport, hostel, etc.)
- [ ] Create `FeeInvoice` entity with due dates
- [ ] Create `Payment` entity (amount, date, paymentMethod, transactionId)
- [ ] Implement auto-invoice generation (monthly/termly)
- [ ] Build payment gateway integration (Stripe/Razorpay/Flutterwave)
- [ ] Add late fee calculation
- [ ] Create fee concession use case (discount, scholarship)

**Frontend Tasks:**
- [ ] Fee structure configuration (define fee heads)
- [ ] Invoice management (view, send reminders)
- [ ] Payment collection form (cash/cheque/online)
- [ ] Parent fee portal (view invoices, pay online)
- [ ] Fee collection reports (daily, monthly, pending)

**Acceptance Criteria:**
- Auto-generates invoice on 1st of every month
- Parent receives email with payment link
- Payment reconciles automatically from Stripe webhook

---

#### 3.2 HR & Payroll (EPIC HR10)
**Priority:** P2

**Backend Tasks:**
- [ ] Create `Staff` entity (employee details, joining date, salary)
- [ ] Create `Department` entity
- [ ] Create `Leave` entity (type, start/end dates, status)
- [ ] Create `Payroll` entity (basic salary, allowances, deductions)
- [ ] Implement leave balance tracking
- [ ] Build payslip generator

**Frontend Tasks:**
- [ ] Staff registration form
- [ ] Leave application form (staff portal)
- [ ] Leave approval dashboard (manager view)
- [ ] Payroll processing (monthly salary calculation)
- [ ] Payslip view/download

**Acceptance Criteria:**
- Teacher applies for 3-day leave, HOD approves
- Payroll auto-deducts tax and PF
- Payslip shows breakdown of salary components

---

#### 3.3 Library Management (EPIC LIB11)
**Priority:** P2

**Backend Tasks:**
- [ ] Create `Book` entity (ISBN, title, author, quantity)
- [ ] Create `BookIssue` entity (studentId/staffId, issueDate, returnDate, fine)
- [ ] Implement book issue/return use case
- [ ] Add overdue fine calculation
- [ ] Build book search (by title, author, ISBN)

**Frontend Tasks:**
- [ ] Book catalog management (add/edit books)
- [ ] Book issue interface (scan barcode, select student)
- [ ] Overdue books report
- [ ] Student book history

**Acceptance Criteria:**
- Can issue book to student with return date 14 days later
- Overdue book shows $0.50/day fine

---

#### 3.4 Transport & Safety (EPIC TR12)
**Priority:** P2

**Backend Tasks:**
- [ ] Create `Route` entity (route name, stops, driver)
- [ ] Create `Vehicle` entity (registration, capacity, insurance expiry)
- [ ] Create `TransportAllocation` entity (studentId, routeId, pickup point)
- [ ] Implement GPS tracking integration (optional plugin)

**Frontend Tasks:**
- [ ] Route management (define stops with timing)
- [ ] Vehicle maintenance tracking
- [ ] Student route assignment
- [ ] Transport fee collection

---

### 🟧 **Phase 4: Advanced Features & Ecosystem** (4-6 weeks)

#### 4.1 Communications & Engagement (EPIC C14)
**Priority:** P1

**Backend Tasks:**
- [ ] Create `Notification` entity (multi-channel: email, SMS, push, in-app)
- [ ] Create `Announcement` entity (audience: all, teachers, parents, specific class)
- [ ] Implement notification service with templates
- [ ] Build email queue with retry logic
- [ ] Add SMS gateway integration (Twilio)

**Frontend Tasks:**
- [ ] Announcement composer (rich text editor, audience selector)
- [ ] Notification center (bell icon with unread count)
- [ ] Parent/student mobile app (push notifications)

---

#### 4.2 Reporting & Analytics (EPIC R15)
**Priority:** P1

**Backend Tasks:**
- [ ] Create report builder engine (query builder + PDF generator)
- [ ] Pre-built reports: Enrollment trends, Fee collection, Attendance summary
- [ ] Create dashboard KPI aggregation service
- [ ] Implement scheduled report delivery (email weekly/monthly reports)

**Frontend Tasks:**
- [ ] Interactive dashboards with Chart.js/ApexCharts
- [ ] Custom report builder UI
- [ ] Report scheduling interface

---

#### 4.3 API & Integrations (EPIC API16)
**Priority:** P2

**Tasks:**
- [ ] Complete OpenAPI/Swagger documentation
- [ ] Create public API with rate limiting
- [ ] Build webhook system for external integrations
- [ ] Implement OAuth2 for third-party apps
- [ ] Create integration plugins (Google Classroom, Microsoft Teams, Zoom)

---

#### 4.4 Plugin Marketplace (EPIC M17)
**Priority:** P2

**Tasks:**
- [ ] Plugin submission portal (developer uploads plugin ZIP)
- [ ] Plugin review/approval workflow (manual review by admin)
- [ ] Marketplace UI (browse, search, install plugins)
- [ ] Plugin versioning and update mechanism
- [ ] Plugin revenue sharing (if paid plugins)

---

## 🧩 Plugin Examples (After Framework Complete)

### Sample Plugins to Build

1. **SMS Gateway Plugin** (Twilio, Africa's Talking, etc.)
2. **Payment Gateway Plugin** (Stripe, Razorpay, M-Pesa)
3. **Video Conferencing Plugin** (Zoom, Google Meet integration)
4. **Google Workspace Sync** (sync users, calendar events)
5. **Advanced Analytics** (ML-based insights, predictive analytics)
6. **Mobile App Builder** (white-label mobile apps for schools)
7. **Parent-Teacher Chat** (real-time messaging)
8. **Hostel Management** (room allocation, mess menu)
9. **E-Learning LMS** (course content, assignments, quizzes)

---

## 📐 Architecture Decisions

### Backend (NestJS)

**Hexagonal Architecture Layers:**
```
src/
├── domain/              # Pure business logic, entities, ports
│   ├── student/
│   │   ├── entities/
│   │   └── ports/
│   ├── tenant/
│   └── [feature]/
├── application/         # Use cases (orchestration)
│   ├── student/
│   │   └── use-cases/
│   └── [feature]/
├── infrastructure/      # External adapters (DB, email, SMS)
│   └── persistence/
│       └── mongoose/
├── adapters/            # HTTP/GraphQL controllers
│   └── http/
│       └── students/
└── modules/             # NestJS modules (wiring)
```

**Multi-Tenancy Pattern:**
- Every entity has `tenantId: string` field
- All indexes are compound with `tenantId` as first field
- `TenantGuard` extracts tenantId from JWT/header
- `TenantContext` stores current tenantId in AsyncLocalStorage
- Repositories auto-inject `tenantId` in queries

**Plugin Architecture:**
```typescript
interface IPlugin {
  name: string;
  version: string;
  onInstall(context: PluginContext): Promise<void>;
  onEnable(context: PluginContext): Promise<void>;
  onDisable(context: PluginContext): Promise<void>;
  onUninstall(context: PluginContext): Promise<void>;
}

interface PluginContext {
  tenantId: string;
  database: Database;
  eventBus: EventBus;
  logger: Logger;
}
```

---

### Frontend (Angular 17)

**Module Structure:**
```
app/
├── core/
│   ├── guards/
│   ├── interceptors/
│   ├── services/        # Singleton services
│   └── models/
├── shared/
│   ├── components/      # Reusable UI components
│   └── directives/
├── layouts/
│   └── main-layout/
└── modules/
    ├── students/
    │   ├── pages/
    │   ├── components/
    │   └── students.routes.ts
    └── [feature]/
```

**Plugin Extension Points:**
- Route injection: Plugins add routes to main routing config
- Menu injection: `MenuService.register(menuItem)`
- Dashboard widgets: `DashboardRegistry.addWidget(widget)`
- Settings pages: Plugins add tabs to global settings

---

## 🚀 Deployment Architecture

### Infrastructure (Target)

**Cloud Provider:** AWS (or Azure/GCP)

**Services:**
- **Frontend:** S3 + CloudFront (static hosting)
- **Backend API:** ECS Fargate (containerized NestJS)
- **Database:** MongoDB Atlas (multi-region)
- **File Storage:** S3 (tenant-isolated buckets: `{env}-mindbloom-{tenantId}`)
- **CDN:** CloudFront for assets
- **Email:** SES or SendGrid
- **SMS:** Twilio/SNS
- **Monitoring:** CloudWatch, Sentry
- **CI/CD:** GitHub Actions → ECR → ECS

**Multi-Tenancy Data Isolation:**
- Database: Shared schema with `tenantId` filtering
- File Storage: Separate S3 buckets per tenant
- Cache: Redis with `{tenantId}:*` key prefixes

---

## 📋 Definition of Done (DoD)

For each EPIC/Feature to be marked "Complete":

- [ ] Backend: Domain entities defined
- [ ] Backend: Use cases implemented with unit tests
- [ ] Backend: Repository with integration tests
- [ ] Backend: Controller with OpenAPI docs
- [ ] Backend: E2E tests with Postman/Newman
- [ ] Frontend: UI components implemented
- [ ] Frontend: Services with unit tests
- [ ] Frontend: Integration tests (Cypress/Playwright)
- [ ] Documentation: API docs updated
- [ ] Documentation: User guide section written
- [ ] Security: Permission checks implemented
- [ ] Multi-tenancy: Tenant isolation verified
- [ ] Code review approved
- [ ] QA testing passed

---

## 📊 Effort Estimation

| Phase | EPICs | Estimated Time | Complexity |
|-------|-------|----------------|------------|
| Phase 1: Platform Foundation | 4 EPICs | 4-6 weeks | High (Plugin framework is complex) |
| Phase 2: Core School Ops | 5 EPICs | 8-10 weeks | Medium-High |
| Phase 3: Financial & Admin | 4 EPICs | 6-8 weeks | Medium |
| Phase 4: Advanced Features | 4 EPICs | 4-6 weeks | Medium |
| **TOTAL** | **17 EPICs** | **22-30 weeks** | **(5-7 months)** |

**Team Size Assumption:** 2-3 full-stack developers

---

## 🎯 Success Metrics

### Phase 1 Success Criteria
- ✅ Sample plugin can be installed without code changes
- ✅ Can create custom role with granular permissions
- ✅ Tenant admin can manage users without developer intervention

### Phase 2 Success Criteria
- ✅ Can enroll 100 students in 10 classes
- ✅ Teacher marks attendance for 40 students in <2 minutes
- ✅ Report card generation takes <5 seconds

### Phase 3 Success Criteria
- ✅ Payment gateway processes real transaction
- ✅ Payroll generates accurate payslips for 50 staff
- ✅ Can issue 20 library books per day

### Phase 4 Success Criteria
- ✅ Send 1000 notifications in <10 seconds
- ✅ Custom report builder generates complex report
- ✅ Marketplace has 5+ live plugins

---

## 🔄 Next Steps

### Immediate Actions (This Week)

1. **Review & Approve Roadmap**
   - [ ] Stakeholder review of this document
   - [ ] Prioritize any changes to phase order
   - [ ] Confirm technology stack decisions

2. **Setup Development Workflow**
   - [ ] Create GitHub Project board with EPICs
   - [ ] Setup branch strategy (main, develop, feature/*)
   - [ ] Configure CI/CD pipeline (GitHub Actions)
   - [ ] Setup staging environment

3. **Kick Off Phase 1.1: Plugin Framework**
   - [ ] Create branch: `feature/plugin-framework`
   - [ ] Design `IPlugin` interface (mob programming session)
   - [ ] Spike: Research NestJS dynamic modules for plugin loading
   - [ ] Create ADR (Architecture Decision Record) for plugin architecture

4. **Documentation Setup**
   - [ ] Initialize GitHub Wiki
   - [ ] Create API documentation site (Docusaurus/VitePress)
   - [ ] Setup developer onboarding guide

---

## 📖 Reference Documents

- **Full Requirements:** `requirement.md` (718 lines)
- **Current Project State:** `PROJECT_SUMMARY.md`
- **Setup Instructions:** `SETUP.md`
- **Testing Guide:** `TESTING_TENANT_VALIDATION.md`

---

## 🏁 Conclusion

This roadmap transforms the 718-line `requirement.md` into a **phased, actionable plan** spanning **5-7 months**. The critical decision is to **build the plugin framework FIRST** (Phase 1), as it's the architectural foundation for the entire SaaS platform.

Key insights:
- **Current state:** Strong multi-tenancy foundation, but most functional modules are empty scaffolds
- **Priority:** Plugin framework blocks everything else
- **Risk:** Phase 2 will be longest (core school features are complex)
- **Opportunity:** Plugin marketplace creates revenue stream and ecosystem

**Recommendation:** Start with **Phase 1.1 (Plugin Framework)** immediately. This 2-week sprint will validate the architectural approach before investing in 17 EPICs of functional modules.

---

**Document Version:** 1.0  
**Last Updated:** {Current Date}  
**Owner:** Development Team  
**Status:** 📝 Draft - Awaiting Approval
