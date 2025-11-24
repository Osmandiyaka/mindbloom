# Library Management System Plugin - Task Breakdown

## Phase 1: Foundation & Setup (Start Here)
### Task 1.1: Create Branch & Plugin Structure ✓
- [x] Create new branch `feature/library-plugin-enhanced`
- [ ] Set up backend plugin folder structure
- [ ] Set up frontend plugin folder structure
- [ ] Create plugin manifest skeleton

### Task 1.2: Database Schema Design
- [ ] Design core entities (titles, copies, transactions)
- [ ] Design supporting entities (reservations, fines, locations)
- [ ] Create TypeORM entity classes
- [ ] Create initial migrations

### Task 1.3: Backend Module Skeleton
- [ ] Create LibraryModule with proper imports
- [ ] Set up tenant context integration
- [ ] Create base DTOs (CreateTitleDto, CreateCopyDto, etc.)
- [ ] Set up module registration in app.module.ts

## Phase 2: Core Domain - Inventory Management
### Task 2.1: Book Titles Management
- [ ] Implement BookTitle entity with full metadata
- [ ] Create TitlesService (CRUD operations)
- [ ] Create TitlesController with REST endpoints
- [ ] Add validation and error handling

### Task 2.2: Book Copies Management
- [ ] Implement BookCopy entity with status enum
- [ ] Create CopiesService with status transitions
- [ ] Create CopiesController
- [ ] Implement barcode/RFID support

### Task 2.3: Location Hierarchy
- [ ] Implement Location entity (building→floor→section→shelf)
- [ ] Create LocationService
- [ ] Create LocationController
- [ ] Add location assignment to copies

## Phase 3: Circulation System
### Task 3.1: Checkout/Return Flow
- [ ] Implement BorrowTransaction entity
- [ ] Create CirculationService with transaction support
- [ ] Implement checkout method with validation
- [ ] Implement return method with fine calculation
- [ ] Add SELECT FOR UPDATE for concurrency control

### Task 3.2: Renewals System
- [ ] Implement renewal validation logic
- [ ] Add renewal counter to transactions
- [ ] Create renewal endpoint
- [ ] Add policy checks (max renewals, reservations, fines)

### Task 3.3: Reservations/Holds Queue
- [ ] Implement Reservation entity with FIFO queue
- [ ] Create ReservationService
- [ ] Implement reserve/cancel/fulfill methods
- [ ] Add auto-promotion when copy returned
- [ ] Create notification triggers

## Phase 4: Fines & Policies
### Task 4.1: Fine Calculation System
- [ ] Implement FineLedger entity (immutable audit log)
- [ ] Create FineService with calculation logic
- [ ] Add fine assessment on overdue returns
- [ ] Implement pay/waive fine methods

### Task 4.2: Library Policies
- [ ] Implement LibrarySettings entity (JSONB config)
- [ ] Create PolicyService
- [ ] Add loan duration policies by role/item type
- [ ] Add max concurrent loans/reservations
- [ ] Add fine rates and grace periods

## Phase 5: Search & Discovery
### Task 5.1: Basic Search
- [ ] Implement full-text search on titles
- [ ] Add author search
- [ ] Create SearchService
- [ ] Add search endpoint with pagination

### Task 5.2: Advanced Filters
- [ ] Add category/genre facets
- [ ] Add publication year filtering
- [ ] Add availability filtering
- [ ] Implement sort options

### Task 5.3: Recommendations
- [ ] Add "most borrowed" query
- [ ] Add "recent additions" query
- [ ] Create recommendations endpoint

## Phase 6: Frontend Foundation
### Task 6.1: Angular Module Setup
- [ ] Create LibraryModule in plugins folder
- [ ] Set up routing structure
- [ ] Create library.routes.ts
- [ ] Register routes in plugins.routes.ts

### Task 6.2: Shared UI Components
- [ ] Create metric card component
- [ ] Create book card component
- [ ] Create status badge component
- [ ] Create search bar component
- [ ] Create filter panel component

### Task 6.3: Theme & Styling
- [ ] Create library-theme.scss with blue sidebar
- [ ] Define color palette (blue/indigo/teal)
- [ ] Create layout components (sidebar, header)
- [ ] Set up responsive breakpoints

## Phase 7: Frontend - Member Views
### Task 7.1: Library Dashboard
- [ ] Create LibraryDashboardComponent
- [ ] Add KPI metrics tiles
- [ ] Add loan charts (area/line)
- [ ] Add "due soon" section
- [ ] Add "tasks today" for librarians

### Task 7.2: Catalog & Search
- [ ] Create CatalogComponent with grid/list view
- [ ] Add search and filter integration
- [ ] Create BookDetailComponent
- [ ] Add availability display by location
- [ ] Add reserve/borrow action buttons

### Task 7.3: My Account
- [ ] Create MyAccountComponent with tabs
- [ ] Add borrowed items view
- [ ] Add reservation list
- [ ] Add fines summary
- [ ] Add reading history
- [ ] Implement renew action

## Phase 8: Frontend - Librarian Tools
### Task 8.1: Circulation Desk
- [ ] Create CirculationDeskComponent
- [ ] Add barcode scanner input
- [ ] Add member lookup
- [ ] Implement checkout flow UI
- [ ] Implement return flow UI
- [ ] Add fine collection interface

### Task 8.2: Today's Desk View
- [ ] Add due today list
- [ ] Add overdue items
- [ ] Add pending reservations to fulfill
- [ ] Add quick action buttons

## Phase 9: Frontend - Admin Views
### Task 9.1: Titles Management
- [ ] Create AdminTitlesComponent (table view)
- [ ] Add title form (create/edit)
- [ ] Add cover upload
- [ ] Add metadata fields
- [ ] Add bulk import UI (can stub backend)

### Task 9.2: Copies Management
- [ ] Create AdminCopiesComponent
- [ ] Add copy table with status/location
- [ ] Add copy form
- [ ] Add bulk status updates
- [ ] Add location assignment

### Task 9.3: Policies & Settings
- [ ] Create PoliciesComponent
- [ ] Add loan duration config form
- [ ] Add fine rate config
- [ ] Add max limits config
- [ ] Add save/preview functionality

### Task 9.4: Reports
- [ ] Create ReportsComponent
- [ ] Add overdue items report
- [ ] Add active fines report
- [ ] Add top books report
- [ ] Add usage by type report
- [ ] Add export to CSV

## Phase 10: Integration & Events
### Task 10.1: Plugin Manifest
- [ ] Create library.plugin.json
- [ ] Define plugin metadata
- [ ] Define required permissions
- [ ] Define menu items
- [ ] Define published events

### Task 10.2: Event Publishing
- [ ] Publish checkout events
- [ ] Publish return events
- [ ] Publish reservation events
- [ ] Publish fine assessed events
- [ ] Integrate with platform event bus

### Task 10.3: Notifications
- [ ] Create notification templates
- [ ] Add overdue reminders
- [ ] Add reservation available notices
- [ ] Add reservation expiry notices
- [ ] Hook into platform notification service

## Phase 11: Testing & Quality
### Task 11.1: Backend Tests
- [ ] Unit tests for CirculationService
- [ ] Unit tests for FineService
- [ ] Unit tests for ReservationService
- [ ] Integration tests for checkout flow

### Task 11.2: E2E Tests
- [ ] E2E test: Member borrows book
- [ ] E2E test: Member reserves unavailable book
- [ ] E2E test: Return overdue book generates fine
- [ ] E2E test: Reservation auto-fulfillment

### Task 11.3: Data Seeding
- [ ] Create seed script for sample titles
- [ ] Create seed script for sample copies
- [ ] Create seed script for test transactions
- [ ] Add to marketplace seeding

## Phase 12: Polish & Documentation
### Task 12.1: API Documentation
- [ ] Add Swagger decorators to all endpoints
- [ ] Document request/response schemas
- [ ] Add usage examples

### Task 12.2: User Documentation
- [ ] Create user guide for members
- [ ] Create guide for librarians
- [ ] Create admin configuration guide
- [ ] Add inline help tooltips

### Task 12.3: Deployment & Migration
- [ ] Final migration review
- [ ] Production build test
- [ ] Create deployment checklist
- [ ] Merge to main

---

## Priority Sequence (Recommended Order)

**Sprint 1 (MVP Core):**
1. Tasks 1.1-1.3: Foundation
2. Tasks 2.1-2.2: Basic inventory
3. Tasks 3.1: Checkout/return basics
4. Tasks 6.1-6.2: Frontend foundation
5. Tasks 7.1-7.2: Basic catalog view

**Sprint 2 (Complete Circulation):**
6. Tasks 3.2-3.3: Renewals & reservations
7. Tasks 4.1-4.2: Fines & policies
8. Tasks 7.3: My account
9. Tasks 8.1-8.2: Circulation desk

**Sprint 3 (Admin & Advanced):**
10. Tasks 2.3: Locations
11. Tasks 5.1-5.3: Search & discovery
12. Tasks 9.1-9.4: Admin tools
13. Tasks 6.3: Theme polish

**Sprint 4 (Integration & Quality):**
14. Tasks 10.1-10.3: Events & notifications
15. Tasks 11.1-11.3: Testing
16. Tasks 12.1-12.3: Documentation & deployment

---

## Current Status
- [x] Phase 0: Initial simple library plugin created
- [ ] Ready to start Phase 1

## Notes
- Each task should take 30-90 minutes
- Can be done incrementally
- Test after each phase
- Can adjust priorities based on feedback
