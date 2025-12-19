import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { StudentService } from '../../../../core/services/student.service';
import { Student } from '../../../../core/models/student.model';
import { IconRegistryService } from '../../../../shared/services/icon-registry.service';
import { BreadcrumbsComponent, Crumb } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StudentFormComponent } from '../../../setup/pages/students/student-form/student-form.component';
import { CanDirective } from '../../../../shared/security/can.directive';
import { PERMS } from '../../../../shared/security/permissions';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, ButtonComponent, BadgeComponent, BreadcrumbsComponent, SearchInputComponent, ModalComponent, StudentFormComponent, CanDirective],
  styleUrls: ['./students-list.component.scss'],
  template: `
    <div class="students-page">
      <div class="page-context-card">
        <div class="context-kicker">Students / Hub</div>
        <div class="context-title">Student Management Workspace</div>
        <div class="context-subtitle">Live roster, triage, and quick actions for front-desk staff.</div>
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
          <div class="filter-field">
            <span class="filter-label">Search</span>
            <app-search-input class="search-inline" placeholder="Search students..." (search)="onSearch($event)"></app-search-input>
          </div>
          <div class="filter-field">
            <span class="filter-label">Grade</span>
            <select [(ngModel)]="gradeFilter" (change)="applyFilters()">
              <option value="">All grades</option>
              <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
            </select>
          </div>
          <div class="filter-field">
            <span class="filter-label">Status</span>
            <select [(ngModel)]="statusFilter" (change)="applyFilters()">
              <option value="">All statuses</option>
              <option *ngFor="let s of statuses" [value]="s">{{ s | titlecase }}</option>
            </select>
          </div>
        </div>
        <div class="toolbar-right">
          <div class="bulk-inline" *ngIf="selectedIds().size">
            <span class="selected-count">{{ selectedIds().size }} selected</span>
            <app-button *can="'students.write'" variant="secondary" size="sm" (click)="bulkAction('attendance')">Take attendance</app-button>
            <app-button *can="'students.write'" variant="secondary" size="sm" (click)="bulkAction('note')">Add note</app-button>
          </div>
          <div class="view-toggle" role="group" aria-label="View switch">
            <button
              type="button"
              [class.active]="viewMode() === 'table'"
              (click)="setView('table')"
              title="Table view"
              aria-label="Switch to table view"
              [attr.aria-pressed]="viewMode() === 'table'"
            >
              <span class="icon" [innerHTML]="icon('inbox')"></span>
            </button>
            <button
              type="button"
              [class.active]="viewMode() === 'grid'"
              (click)="setView('grid')"
              title="Grid view"
              aria-label="Switch to grid view"
              [attr.aria-pressed]="viewMode() === 'grid'"
            >
              <span class="icon" [innerHTML]="icon('dashboard')"></span>
            </button>
          </div>
          <div class="actions-menu" [class.open]="actionsOpen">
            <app-button variant="secondary" size="sm" (click)="toggleActions()" aria-label="Open actions menu">
              <span class="icon" [innerHTML]="icon('ellipsis')"></span>
              Actions
              <span class="chevron">▾</span>
            </app-button>
            <div class="menu" *ngIf="actionsOpen">
              <button *can="'students.export'" type="button" (click)="exportAndClose()">
                <span class="icon" [innerHTML]="icon('download')"></span>
                Export
              </button>
              <button *can="'students.create'" type="button" (click)="importAndClose()">
                <span class="icon" [innerHTML]="icon('upload')"></span>
                Import
              </button>
            </div>
          </div>
          <app-button *can="'students.create'" variant="primary" size="sm" (click)="openModal()">
            <span class="icon" [innerHTML]="icon('student-add')"></span> Add Student
          </app-button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state" role="status" aria-live="polite">
          <div class="spinner"></div>
          <p>Loading students...</p>
          <div class="skeleton-stack">
            <div class="skeleton-row" *ngFor="let _ of [1,2,3,4,5]">
              <span class="skeleton-avatar"></span>
              <span class="skeleton-line short"></span>
              <span class="skeleton-line"></span>
              <span class="skeleton-pill"></span>
            </div>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <app-button variant="primary" (click)="loadStudents()">Retry</app-button>
        </div>
      }

      @if (!loading() && !error()) {
        <ng-container [ngSwitch]="activeTabLabel()">
          <ng-container *ngSwitchCase="'Roster Lookup'">
            @if (filteredStudents().length > 0) {
              <ng-container [ngSwitch]="viewMode()">
                <div *ngSwitchCase="'table'" class="data-table">
                  <div class="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th style="width:48px;"><input type="checkbox" [checked]="allSelected()" (change)="toggleSelectAll($event)"/></th>
                    <th class="sortable">Student</th>
                    <th>ID</th>
                    <th class="class-col">Class/Section</th>
                    <th>Guardian Name and Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let student of filteredStudents()" class="row-clickable" [routerLink]="['/students', student.id]">
                    <td><input type="checkbox" [checked]="isSelected(student.id)" (click)="toggleSelect($event, student.id)"/></td>
                          <td class="col-primary student-cell">
                            <div class="student-meta">
                              <div class="avatar-wrap" aria-hidden="true">
                                <span class="avatar">{{ initials(student.fullName) }}</span>
                              </div>
                              <div class="student-name-block">
                                <div class="name-row">
                                  <span class="name">{{ student.fullName }}</span>
                                  <span class="status-chip" [ngClass]="hasFeeDue(student) ? 'due' : 'clear'">{{ hasFeeDue(student) ? 'Fees Due' : 'No Fees Due' }}</span>
                                </div>
                                <span class="student-id">ID · {{ student.enrollment.admissionNumber }}</span>
                              </div>
                            </div>
                          </td>
                    <td>{{ student.enrollment.admissionNumber || '—' }}</td>
                    <td class="class-col">{{ student.enrollment.class }}{{ student.enrollment.section ? '-' + student.enrollment.section : '' }}</td>
                    <td>
                      <div class="meta-cell">
                        <div>{{ primaryGuardianName(student) }}</div>
                        <div class="muted tiny phone-line">
                          <span>{{ primaryGuardianPhone(student) }}</span>
                          <a
                            class="phone-link"
                            [href]="primaryGuardianPhoneHref(student)"
                            [attr.aria-label]="'Call ' + primaryGuardianName(student)"
                            (click)="$event.stopPropagation()">
                            <span class="icon" [innerHTML]="icon('phone')"></span>
                            Call
                          </a>
                        </div>
                        <div class="trust-pill">
                          <span class="icon" [innerHTML]="icon('lock')"></span>
                          <span>Protected contact</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="cell-actions">
                        <button (click)="logAttendanceAction($event, student)" title="Record attendance"><span class="icon" [innerHTML]="icon('calendar')"></span></button>
                        <button (click)="contactGuardianAction($event, student)" title="Contact guardian"><span class="icon" [innerHTML]="icon('phone')"></span></button>
                        <div class="more-menu" [class.open]="rowMenuOpen() === student.id">
                          <button (click)="toggleRowMenu($event, student.id)" title="More actions"><span class="icon" [innerHTML]="icon('ellipsis')"></span></button>
                          <div class="menu-panel" *ngIf="rowMenuOpen() === student.id">
                            <button *can="'students.read'" (click)="openQuickView($event, student)">Quick view</button>
                            <button *can="'students.write'" (click)="logIncidentAction($event, student)">Log incident</button>
                            <button *can="'students.update'" (click)="editStudent($event, student.id)">Edit</button>
                            <button *can="'students.delete'" class="danger" (click)="deleteStudent($event, student)">Delete</button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div *ngSwitchCase="'grid'" class="card-grid" role="list" aria-label="Student grid view">
                  <article
                    class="student-card"
                    *ngFor="let student of filteredStudents()"
                    role="listitem"
                    tabindex="0"
                    (click)="viewStudent($event, student.id)"
                    (keyup.enter)="viewStudent($event, student.id)"
                    (keyup.space)="viewStudent($event, student.id)"
                    [attr.aria-label]="'Open profile for ' + student.fullName"
                    [attr.aria-describedby]="'student-'+student.id"
                  >
                    <div class="card-hero">
                      <div class="hero-main">
                        <div class="avatar-wrap" aria-hidden="true">
                          <span class="avatar">{{ initials(student.fullName) }}</span>
                        </div>
                        <div class="hero-text">
                          <div class="name-line">
                            <h3 id="{{ 'student-' + student.id }}">{{ student.fullName }}</h3>
                          </div>
                          <div class="sub-line">
                            <span class="grade-pill">
                              <span class="icon tiny" [innerHTML]="icon('students')"></span>
                              Class {{ student.enrollment.class }}{{ student.enrollment.section ? '-' + student.enrollment.section : '' }}
                            </span>
                            <span class="status-pill" [ngClass]="student.status">{{ student.status }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="meta-grid simple">
                      <div class="meta-line">
                        <span class="icon tiny" [innerHTML]="icon('mail')"></span>
                        <div>
                          <p class="eyebrow xxs">Email</p>
                          <p class="value">{{ student.email || 'Email not provided' }}</p>
                        </div>
                      </div>
                      <div class="meta-line">
                        <span class="icon tiny" [innerHTML]="icon('students')"></span>
                        <div>
                          <p class="eyebrow xxs">Admission</p>
                          <p class="value">{{ student.enrollment.admissionNumber }}</p>
                        </div>
                      </div>
                      <div class="meta-line">
                        <span class="icon tiny" [innerHTML]="icon('phone')"></span>
                        <div>
                          <p class="eyebrow xxs">Contact</p>
                          <p class="value">{{ student.phone || 'Not provided' }}</p>
                        </div>
                      </div>
                    </div>

                    <div class="divider"></div>
                    <div class="card-actions" role="group" [attr.aria-label]="'Actions for ' + student.fullName">
                      <button type="button" [attr.aria-label]="'View ' + student.fullName" (click)="viewStudent($event, student.id)">
                        <span class="icon" [innerHTML]="icon('eye')"></span>
                        <span class="sr-only">View</span>
                      </button>
                      <button *can="'students.update'" type="button" [attr.aria-label]="'Edit ' + student.fullName" (click)="editStudent($event, student.id)">
                        <span class="icon" [innerHTML]="icon('edit')"></span>
                        <span class="sr-only">Edit</span>
                      </button>
                      <button *can="'students.delete'" type="button" [attr.aria-label]="'Delete ' + student.fullName" (click)="deleteStudent($event, student)">
                        <span class="icon" [innerHTML]="icon('trash')"></span>
                        <span class="sr-only">Delete</span>
                      </button>
                    </div>
                  </article>
                </div>
              </ng-container>
            }
            @if (filteredStudents().length === 0) {
              <div class="empty-state">
                <h3>No students found</h3>
                <p>Get started by adding your first student</p>
                <app-button variant="primary" (click)="openModal()">
                  + Add New Student
                </app-button>
              </div>
            }
          </ng-container>

          <div *ngSwitchCase="'Today Triage'" class="stub-panel">
            <h3>Today Triage</h3>
            <div class="stub-grid">
              <div class="stub-card" *ngFor="let item of triageToday">
                <div class="stub-title">{{ item.name }}</div>
                <div class="stub-value">{{ item.value }}</div>
                <button type="button" class="stub-cta">{{ item.cta }}</button>
              </div>
            </div>
          </div>

          <div *ngSwitchCase="'Health Flags'" class="stub-panel">
            <h3>Health Flags</h3>
            <div class="stub-grid">
              <div class="stub-card" *ngFor="let item of healthFlags">
                <div class="stub-title">{{ item.name }}</div>
                <div class="stub-value">{{ item.value }}</div>
                <button type="button" class="stub-cta">{{ item.cta }}</button>
              </div>
            </div>
          </div>

          <div *ngSwitchCase="'Pending Tasks'" class="stub-panel">
            <h3>Pending Tasks</h3>
            <ul class="stub-list">
              <li *ngFor="let item of pendingTasks">
                <div class="stub-title">{{ item.name }}</div>
                <div class="stub-detail">{{ item.detail }}</div>
              </li>
            </ul>
          </div>

          <div *ngSwitchDefault class="stub-panel">
            <h3>{{ activeTabLabel() }}</h3>
            <p>Content coming soon.</p>
          </div>
        </ng-container>
      }
    </div>

    <!-- Quick View Drawer -->
        <div class="quick-view-overlay" *ngIf="quickViewStudent()">
          <div class="quick-view-backdrop" (click)="closeQuickView()"></div>
          <aside class="quick-view-drawer">
            <div class="drawer-handle"></div>
            <div class="drawer-container">
              <header class="quick-view-header">
                <div class="header-main">
                  <div class="photo-frame hero" [class.has-photo]="quickViewStudent()!.photo">
                    <img *ngIf="quickViewStudent()!.photo" [src]="quickViewStudent()!.photo" [alt]="quickViewStudent()!.fullName" />
                    <span *ngIf="!quickViewStudent()!.photo" class="avatar">{{ initials(quickViewStudent()!.fullName) }}</span>
                  </div>
                  <div class="header-text">
                    <div class="name-row">
                      <h3>{{ quickViewStudent()!.fullName }}</h3>
                      <div class="chip-row">
                        <span class="status-pill" [ngClass]="(quickViewStudent()!.status || 'active')">{{ (quickViewStudent()!.status || 'active') | titlecase }}</span>
                        <span class="id-chip">{{ quickViewStudent()!.enrollment.admissionNumber || 'ID —' }}</span>
                        <span class="grade-chip">Grade {{ quickViewStudent()!.enrollment.class }}{{ quickViewStudent()!.enrollment.section ? '-' + quickViewStudent()!.enrollment.section : '' }}</span>
                        <span class="status-chip" [ngClass]="hasFeeDue(quickViewStudent()!) ? 'due' : 'clear'">
                          {{ hasFeeDue(quickViewStudent()!) ? 'Fees Due' : 'No Fees Due' }}
                        </span>
                      </div>
                    </div>
                    <p class="subline">
                      DOB {{ quickViewStudent()!.dateOfBirth | date:'mediumDate' }}
                    </p>
                  </div>
                </div>
                <div class="header-alert" *ngIf="hasFeeDue(quickViewStudent()!) || healthAlert(quickViewStudent()!)">
                  <span class="pill critical" *ngIf="healthAlert(quickViewStudent()!)">{{ healthAlert(quickViewStudent()!) }}</span>
                  <span class="pill critical" *ngIf="hasFeeDue(quickViewStudent()!)">Outstanding fees</span>
                </div>
                <button class="icon-btn" type="button" (click)="closeQuickView()" aria-label="Close quick view">
                  <span [innerHTML]="icon('close')"></span>
                </button>
              </header>
              <div class="quick-view-body">
                <div class="pane-grid">
                  <div class="pane identity-pane">
                    <div class="identity-block">
                      <div class="photo-frame hero large" [class.has-photo]="quickViewStudent()!.photo">
                        <img *ngIf="quickViewStudent()!.photo" [src]="quickViewStudent()!.photo" [alt]="quickViewStudent()!.fullName" />
                        <span *ngIf="!quickViewStudent()!.photo" class="avatar">{{ initials(quickViewStudent()!.fullName) }}</span>
                      </div>
                      <div class="id-copy">
                        <div class="name-lg">{{ quickViewStudent()!.fullName }}</div>
                        <div class="id-line">
                          <span class="badge id">{{ quickViewStudent()!.enrollment.admissionNumber || 'ID —' }}</span>
                          <span class="badge grade">Grade {{ quickViewStudent()!.enrollment.class }}{{ quickViewStudent()!.enrollment.section ? '-' + quickViewStudent()!.enrollment.section : '' }}</span>
                        </div>
                        <div class="alert-block" *ngIf="healthAlert(quickViewStudent()!) || hasFeeDue(quickViewStudent()!)">
                          <span class="pill critical" *ngIf="healthAlert(quickViewStudent()!)">{{ healthAlert(quickViewStudent()!) }}</span>
                          <span class="pill warn" *ngIf="hasFeeDue(quickViewStudent()!)">Fees outstanding</span>
                        </div>
                      </div>
                    </div>
                    <app-button variant="primary" size="sm" (click)="viewStudent($event, quickViewStudent()!.id)">
                      <span class="icon" [innerHTML]="icon('eye')"></span>
                      Open full profile
                    </app-button>
                  </div>

                  <div class="pane middle-pane">
                    <div class="tile">
                      <div class="section-title">Primary guardian</div>
                      <div class="kv-row"><span class="label">Name</span><span class="value">{{ primaryGuardianName(quickViewStudent()!) }}</span></div>
                      <div class="kv-row"><span class="label">Relationship</span><span class="value">{{ primaryGuardianRelationship(quickViewStudent()!) }}</span></div>
                      <div class="kv-row action-row"><span class="label">Contact</span><a class="value link" [href]="primaryGuardianPhoneHref(quickViewStudent()!)">{{ primaryGuardianPhone(quickViewStudent()!) }}</a></div>
                    </div>
                    <div class="tile">
                      <div class="section-title">Logistics</div>
                      <div class="kv-row"><span class="label">Current class</span><span class="value">Class {{ quickViewStudent()!.enrollment.class }}{{ quickViewStudent()!.enrollment.section ? '-' + quickViewStudent()!.enrollment.section : '' }}</span></div>
                      <div class="kv-row"><span class="label">Fee status</span><span class="pill subtle" [ngClass]="hasFeeDue(quickViewStudent()!) ? 'due' : 'clear'">{{ hasFeeDue(quickViewStudent()!) ? 'Outstanding' : 'Clear' }}</span></div>
                      <div class="kv-row"><span class="label">Last updated</span><span class="value">{{ quickViewStudent()!.updatedAt | date:'mediumDate' }}</span></div>
                    </div>
                  </div>

                  <div class="pane right-pane">
                    <div class="tile gauge">
                      <div class="section-title">Attendance</div>
                      <div class="ring-row">
                        <div class="ring" [style.--val]="attendancePercent(quickViewStudent()!) * 3.6"><span>{{ attendancePercent(quickViewStudent()!) }}%</span></div>
                        <div class="ring-label">Year to date</div>
                      </div>
                      <div class="kv-row"><span class="label">Health flags</span><span class="pill critical" *ngIf="healthAlert(quickViewStudent()!)">{{ healthAlert(quickViewStudent()!) }}</span><span class="pill neutral" *ngIf="!healthAlert(quickViewStudent()!)">No active flags</span></div>
                      <div class="kv-row"><span class="label">Documents</span><span class="value">{{ documentsCount(quickViewStudent()!) }} on file</span></div>
                    </div>
                    <div class="tile">
                      <div class="section-title">Recent activity</div>
                      <ul class="activity-list">
                        <li *ngFor="let item of quickViewTimeline(quickViewStudent()!)">
                          <span class="bullet" [ngClass]="item.tone"></span>
                          <div class="activity-copy">
                            <div class="activity-title">{{ item.title }}</div>
                            <div class="activity-meta">{{ item.meta }}</div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <footer class="quick-view-footer">
                <app-button variant="secondary" size="sm" (click)="logAttendanceAction($event, quickViewStudent()!)">
                  <span class="icon" [innerHTML]="icon('calendar')"></span>
                  Record attendance
                </app-button>
                <app-button variant="secondary" size="sm" (click)="contactGuardianAction($event, quickViewStudent()!)">
                  <span class="icon" [innerHTML]="icon('phone')"></span>
                  Call guardian
                </app-button>
                <app-button variant="primary" size="sm" (click)="viewStudent($event, quickViewStudent()!.id)">
                  <span class="icon" [innerHTML]="icon('eye')"></span>
                  Open profile
                </app-button>
              </footer>
            </div>
          </aside>
        </div>

    <app-modal [isOpen]="modalOpen()" (closed)="closeModal()" title="Add Student" size="xl">
      <app-student-form (submitted)="onModalSubmit()" (cancelled)="closeModal()"></app-student-form>
    </app-modal>
  `
})
export class StudentsListComponent implements OnInit {
  @Input() showBreadcrumbs = true;
  allStudents = signal<Student[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = '';
  viewMode = signal<'table' | 'grid'>('table');
  rowMenuOpen = signal<string | null>(null);
  gradeFilter = '';
  statusFilter = 'active';
  actionsOpen = false;
  grades: string[] = ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
  statuses: string[] = ['active', 'inactive', 'transferred'];
  selectedIds = signal<Set<string>>(new Set());
  modalOpen = signal(false);
  quickViewStudent = signal<Student | null>(null);
  triageToday = [
    { name: 'Late arrivals', value: 3, cta: 'Process' },
    { name: 'Early leaves', value: 1, cta: 'Review' },
    { name: 'Absences to verify', value: 4, cta: 'Verify' }
  ];
  healthFlags = [
    { name: 'Medication needed', value: 2, cta: 'View orders' },
    { name: 'Allergy alerts', value: 3, cta: 'Notify staff' },
    { name: 'Clinic visits today', value: 1, cta: 'Review log' }
  ];
  pendingTasks = [
    { name: 'Call guardian', detail: 'John Doe - absence note missing' },
    { name: 'Collect documents', detail: 'Maria Lee - birth certificate' },
    { name: 'Fee query', detail: 'Sam Patel - overdue notice' }
  ];
  crumbs: Crumb[] = [
    { label: 'Roster' }
  ];
  commandTabs = [
    { label: 'Roster Lookup', active: true },
    { label: 'Today Triage', active: false },
    { label: 'Health Flags', active: false },
    { label: 'Pending Tasks', active: false },
  ];

  constructor(
    private router: Router,
    private studentService: StudentService,
    private icons: IconRegistryService
  ) { }

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = this.searchTerm ? { search: this.searchTerm } : {};

    this.studentService.getStudents(filters).subscribe({
      next: (students: Student[]) => {
        this.allStudents.set(students);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading students:', err);
        this.error.set('Failed to load students. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.applyFilters();
  }

  openModal(): void {
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  onModalSubmit(): void {
    this.closeModal();
    this.loadStudents();
  }

  editStudent(event: Event, id: string): void {
    event.stopPropagation();
    this.closeRowMenu();
    this.router.navigate(['/students', id, 'edit']);
  }

  deleteStudent(event: Event, student: Student): void {
    event.stopPropagation();
    this.closeRowMenu();
    if (confirm(`Are you sure you want to delete ${student.fullName}?`)) {
      this.studentService.deleteStudent(student.id).subscribe({
        next: () => {
          this.loadStudents();
        },
        error: (err: any) => {
          alert('Failed to delete student');
          console.error('Error deleting student:', err);
        }
      });
    }
  }

  importStudents(): void {
    this.router.navigate(['/students/import']);
  }

  importAndClose(): void {
    this.actionsOpen = false;
    this.importStudents();
  }

  exportStudents(): void {
    const filters = this.searchTerm ? { search: this.searchTerm } : {};

    this.studentService.exportStudents(filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        alert('Failed to export students');
        console.error('Error exporting students:', err);
      }
    });
  }

  exportAndClose(): void {
    this.actionsOpen = false;
    this.exportStudents();
  }

  viewStudent(event: Event, id: string): void {
    event.stopPropagation();
    this.router.navigate(['/students', id]);
  }

  setView(mode: 'table' | 'grid') {
    this.viewMode.set(mode);
  }

  toggleActions() {
    this.actionsOpen = !this.actionsOpen;
  }

  icon(name: string) {
    return this.icons.icon(name);
  }

  applyFilters() {
    // No-op; filters are applied via getter
  }

  filteredStudents(): Student[] {
    const term = this.searchTerm.toLowerCase().trim();
    return this.allStudents().filter(s => {
      const matchesTerm =
        !term ||
        s.fullName.toLowerCase().includes(term) ||
        s.enrollment.admissionNumber.toLowerCase().includes(term) ||
        (s.email || '').toLowerCase().includes(term);
      const matchesGrade = !this.gradeFilter || s.enrollment.class?.toLowerCase().startsWith(this.gradeFilter.toLowerCase());
      const matchesStatus = !this.statusFilter || (s.status || '').toLowerCase() === this.statusFilter.toLowerCase();
      return matchesTerm && matchesGrade && matchesStatus;
    });
  }

  initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  toggleSelect(event: Event, id: string) {
    event.stopPropagation();
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.selectedIds.set(next);
  }

  isSelected(id: string) {
    return this.selectedIds().has(id);
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedIds.set(new Set(this.filteredStudents().map(s => s.id)));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  allSelected() {
    const filtered = this.filteredStudents();
    return filtered.length > 0 && filtered.every(s => this.selectedIds().has(s.id));
  }

  setActiveTab(label: string) {
    this.commandTabs = this.commandTabs.map(tab => ({ ...tab, active: tab.label === label }));
  }

  activeTabLabel(): string {
    return this.commandTabs.find(t => t.active)?.label || 'Roster Lookup';
  }

  bulkAction(action: 'attendance' | 'note') {
    // Placeholder for future wiring; keeps UI aligned with bulk flow
    console.log(`Bulk action: ${action}`, Array.from(this.selectedIds()));
  }

  toggleRowMenu(event: Event, id: string) {
    event.stopPropagation();
    this.rowMenuOpen.set(this.rowMenuOpen() === id ? null : id);
  }

  closeRowMenu() {
    this.rowMenuOpen.set(null);
  }

  openQuickView(event: Event, student: Student) {
    event.stopPropagation();
    this.closeRowMenu();
    this.quickViewStudent.set(student);
  }

  closeQuickView() {
    this.quickViewStudent.set(null);
  }

  logAttendanceAction(event: Event, student: Student) {
    event.stopPropagation();
    this.closeRowMenu();
    console.log('Record attendance (stub):', student);
  }

  logIncidentAction(event: Event, student: Student) {
    event.stopPropagation();
    this.closeRowMenu();
    console.log('Log incident (stub):', student);
  }

  contactGuardianAction(event: Event, student: Student) {
    event.stopPropagation();
    this.closeRowMenu();
    console.log('Contact guardian (stub):', this.primaryGuardianPhone(student));
  }

  activeCount(): number {
    const actives = this.allStudents().filter(s => (s.status || '').toLowerCase() === 'active');
    return actives.length || this.allStudents().length;
  }

  triageTotal(): number {
    return this.triageToday.reduce((sum, item) => sum + (item.value || 0), 0);
  }

  healthFlagTotal(): number {
    return this.healthFlags.reduce((sum, item) => sum + (item.value || 0), 0);
  }

  hasFeeDue(student: Student): boolean {
    const anyStudent = student as any;
    return Boolean(anyStudent.feeFlag || anyStudent.feeDue || anyStudent.feeBalance || anyStudent.balanceDue);
  }

  primaryGuardianName(student: Student): string {
    const g = student.guardians && student.guardians.length ? student.guardians[0] : null;
    return g?.name || '—';
  }

  primaryGuardianPhone(student: Student): string {
    const g = student.guardians && student.guardians.length ? student.guardians[0] : null;
    return g?.phone || student.phone || 'No contact';
  }

  primaryGuardianPhoneHref(student: Student): string {
    const raw = this.primaryGuardianPhone(student);
    const digitsOnly = raw.replace(/[^0-9+]/g, '');
    return digitsOnly ? `tel:${digitsOnly}` : '#';
  }

  primaryGuardianRelationship(student: Student): string {
    const g = student.guardians && student.guardians.length ? student.guardians[0] : null;
    return g?.relationship ? (g.relationship.charAt(0).toUpperCase() + g.relationship.slice(1)) : 'Primary';
  }

  primaryGuardianEmail(student: Student): string | null {
    const g = student.guardians && student.guardians.length ? student.guardians[0] : null;
    return g?.email || null;
  }

  healthAlert(student: Student): string | null {
    const allergies = student.medicalInfo?.allergies?.length || 0;
    const meds = student.medicalInfo?.medications?.length || 0;
    if (allergies > 0) return `${allergies} allergy alert${allergies > 1 ? 's' : ''}`;
    if (meds > 0) return `Medication: ${student.medicalInfo?.medications?.[0] || 'on file'}`;
    return null;
  }

  allergyCount(student: Student): number {
    return student.medicalInfo?.allergies?.length || 0;
  }

  documentsCount(student: Student): number {
    return student.documents?.length || 0;
  }

  attendancePercent(student: Student): number {
    const raw = (student as any)?.attendancePercent;
    if (typeof raw === 'number' && !Number.isNaN(raw)) {
      return Math.min(100, Math.max(0, raw));
    }
    return 0;
  }

  quickViewTimeline(student: Student): { title: string; meta: string; tone: 'success' | 'warn' | 'danger' | 'neutral' }[] {
    const items: { title: string; meta: string; tone: 'success' | 'warn' | 'danger' | 'neutral' }[] = [];
    const attendance = this.attendancePercent(student);
    items.push({
      title: `Attendance ${attendance}%`,
      meta: attendance ? 'Year-to-date attendance' : 'Attendance not recorded',
      tone: attendance >= 90 ? 'success' : attendance >= 70 ? 'warn' : 'danger'
    });

    const feeDue = this.hasFeeDue(student);
    items.push({
      title: feeDue ? 'Fees outstanding' : 'Fees clear',
      meta: feeDue ? 'Balance requires follow-up' : 'No balance due',
      tone: feeDue ? 'warn' : 'success'
    });

    const health = this.healthAlert(student);
    items.push({
      title: health ? 'Health alert' : 'Health status',
      meta: health || 'No active flags',
      tone: health ? 'danger' : 'neutral'
    });

    const updatedAt = (student as any)?.updatedAt ? new Date((student as any).updatedAt) : null;
    items.push({
      title: 'Last updated',
      meta: updatedAt ? updatedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Synced recently',
      tone: 'neutral'
    });

    return items;
  }
}
