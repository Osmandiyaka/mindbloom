import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../../../core/services/student.service';
import { Student, StudentStatus } from '../../../../core/models/student.model';
import { UiButtonComponent } from '../../../../shared/ui/buttons/ui-button.component';
import { UiInputComponent } from '../../../../shared/ui/forms/ui-input.component';
import { UiCheckboxComponent } from '../../../../shared/ui/forms/ui-checkbox.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StudentFormComponent } from '../../../setup/pages/students/student-form/student-form.component';
import { CanDirective } from '../../../../shared/security/can.directive';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    UiButtonComponent,
    UiInputComponent,
    UiCheckboxComponent,
    ModalComponent,
    StudentFormComponent,
    CanDirective,
  ],
  styleUrls: ['./students-list.component.scss'],
  template: `
    <div class="students-directory">
      <header class="directory-header">
        <div class="header-left">
          <h1>Students</h1>
          <p>Search, filter, and manage student records.</p>
        </div>
        <div class="header-actions">
          <div class="split-button" [class.open]="addMenuOpen()">
            <ui-button *can="'students.create'" size="sm" variant="primary" (click)="openCreateModal()">
              Add student
            </ui-button>
            <button type="button" class="split-toggle" (click)="toggleAddMenu($event)">▾</button>
            <div class="split-menu" *ngIf="addMenuOpen()">
              <button type="button" *can="'students.create'" (click)="openCreateModal()">Add student</button>
              <button type="button" *can="'students.create'" (click)="openImport()">Import CSV</button>
            </div>
          </div>
          <ui-button size="sm" variant="ghost" (click)="toggleColumns()">Columns</ui-button>
          <div class="overflow" [class.open]="overflowOpen()">
            <ui-button size="sm" variant="ghost" (click)="toggleOverflow($event)">•••</ui-button>
            <div class="overflow-menu" *ngIf="overflowOpen()">
              <button type="button" *can="'students.export'" (click)="exportStudents()">Export CSV</button>
              <button type="button" (click)="openSavedViews()">Saved views</button>
              <button type="button" (click)="bulkHelp()">Bulk actions</button>
            </div>
          </div>
        </div>
      </header>

      <div class="directory-layout">
        <section class="directory-panel" (keydown)="handleKeydown($event)">
          <div class="directory-filters">
            <div class="search-field">
              <ui-input
                [value]="searchTerm()"
                placeholder="Search by name, student ID, admission no., guardian phone/email"
                (valueChange)="updateSearch($event)">
              </ui-input>
              <span class="result-count">{{ filteredStudents().length }} students</span>
            </div>
            <div class="filter-row">
              <select [(ngModel)]="statusFilter" (change)="applyFilters()">
                <option value="">Status</option>
                <option *ngFor="let status of statuses" [value]="status">{{ status | titlecase }}</option>
              </select>
              <select [(ngModel)]="gradeFilter" (change)="applyFilters()">
                <option value="">Grade</option>
                <option *ngFor="let grade of grades" [value]="grade">{{ grade }}</option>
              </select>
              <select [(ngModel)]="classFilter" (change)="applyFilters()">
                <option value="">Class/Section</option>
                <option *ngFor="let group of classSections" [value]="group">{{ group }}</option>
              </select>
              <select [(ngModel)]="yearFilter" (change)="applyFilters()">
                <option value="">Academic year</option>
                <option *ngFor="let year of academicYears" [value]="year">{{ year }}</option>
              </select>
              <button type="button" class="clear-filters" *ngIf="hasFilters()" (click)="clearFilters()">
                Clear all
              </button>
            </div>
          </div>

          <div class="bulk-bar" *ngIf="selectedIds().size">
            <span>{{ selectedIds().size }} selected</span>
            <div class="bulk-actions">
              <ui-button size="sm" variant="ghost" *can="'students.write'" (click)="bulkAssign()">Assign section</ui-button>
              <ui-button size="sm" variant="ghost" *can="'students.write'" (click)="bulkStatus()">Update status</ui-button>
              <ui-button size="sm" variant="ghost" *can="'students.export'" (click)="bulkExport()">Export selected</ui-button>
              <ui-button size="sm" variant="danger" *can="'students.delete'" (click)="bulkArchive()">Archive</ui-button>
            </div>
          </div>

          @if (loading()) {
            <div class="state-block">
              <div class="spinner"></div>
              <p>Loading students...</p>
            </div>
          }

          @if (error()) {
            <div class="state-block error">
              <p>{{ error() }}</p>
              <ui-button size="sm" variant="ghost" (click)="loadStudents()">Retry</ui-button>
            </div>
          }

          @if (!loading() && !error()) {
            @if (filteredStudents().length === 0) {
              <div class="empty-state">
                <p>No students found</p>
                <span>Try adjusting your filters or search terms.</span>
                <div class="empty-actions">
                  <ui-button size="sm" variant="ghost" (click)="clearFilters()">Clear filters</ui-button>
                  <ui-button size="sm" variant="primary" *can="'students.create'" (click)="openCreateModal()">Add student</ui-button>
                </div>
              </div>
            } @else {
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th class="checkbox-col">
                        <div (click)="$event.stopPropagation()">
                          <ui-checkbox
                            [checked]="allSelected()"
                            (checkedChange)="toggleSelectAll($event)"
                            [hideLabel]="true">
                          </ui-checkbox>
                        </div>
                      </th>
                      <th>Student</th>
                      <th>Grade</th>
                      <th>Class/Section</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th class="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="let student of pagedStudents(); let index = index"
                      [class.is-selected]="selectedStudentId() === student.id"
                      (click)="selectStudent(student)"
                      tabindex="0">
                      <td>
                        <div (click)="$event.stopPropagation()">
                          <ui-checkbox
                            [checked]="isSelected(student.id)"
                            (checkedChange)="toggleSelectRow(student.id, $event)"
                            [hideLabel]="true">
                          </ui-checkbox>
                        </div>
                      </td>
                      <td>
                        <div class="student-cell">
                          <div class="avatar">{{ initials(student.fullName) }}</div>
                          <div>
                            <div class="student-name">{{ student.fullName }}</div>
                            <div class="student-id">ID · {{ student.enrollment.admissionNumber || '—' }}</div>
                          </div>
                        </div>
                      </td>
                      <td>{{ student.enrollment.class || '—' }}</td>
                      <td>{{ student.enrollment.class }}{{ student.enrollment.section ? ' · ' + student.enrollment.section : '' }}</td>
                      <td>
                        <span class="status-tag" [class]="'status-' + student.status">{{ student.status | titlecase }}</span>
                      </td>
                      <td>{{ formatUpdated(student.updatedAt) }}</td>
                      <td class="actions-col">
                        <div class="row-actions" [class.open]="rowMenuOpen() === student.id">
                          <button type="button" (click)="toggleRowMenu($event, student.id)">•••</button>
                          <div class="row-menu" *ngIf="rowMenuOpen() === student.id">
                            <button type="button" (click)="selectStudent(student)">View details</button>
                            <button type="button" *can="'students.update'" (click)="editStudent($event, student.id)">Edit student</button>
                            <button type="button" *can="'students.write'" (click)="openTransfer($event, student)">Transfer student</button>
                            <button type="button" *can="'students.write'" (click)="openPromote($event, student)">Promote student</button>
                            <button type="button" class="danger" *can="'students.delete'" (click)="archiveStudent($event, student)">Archive</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="pagination">
                <span>Page {{ page() }} of {{ totalPages() }}</span>
                <div class="pagination-actions">
                  <button type="button" (click)="prevPage()" [disabled]="page() === 1">Previous</button>
                  <button type="button" (click)="nextPage()" [disabled]="page() === totalPages()">Next</button>
                </div>
              </div>
            }
          }
        </section>

        <aside class="detail-panel" *ngIf="selectedStudent() as student">
          <div class="detail-header">
            <div>
              <h2>{{ student.fullName }}</h2>
              <p>
                {{ student.enrollment.admissionNumber || '—' }} ·
                {{ student.status | titlecase }}
              </p>
            </div>
            <div class="detail-actions">
              <ui-button size="sm" variant="ghost" *can="'students.update'" (click)="editStudent($event, student.id)">Edit</ui-button>
              <ui-button size="sm" variant="ghost" (click)="closeDetail()">Close</ui-button>
            </div>
          </div>

          <div class="detail-tabs">
            <button type="button" [class.active]="activeTab() === 'overview'" (click)="activeTab.set('overview')">Overview</button>
            <button type="button" [class.active]="activeTab() === 'enrollment'" (click)="activeTab.set('enrollment')">Enrollment</button>
            <button type="button" [class.active]="activeTab() === 'guardians'" (click)="activeTab.set('guardians')">Guardians</button>
            <button type="button" [class.active]="activeTab() === 'documents'" (click)="activeTab.set('documents')">Documents</button>
            <button type="button" [class.active]="activeTab() === 'access'" (click)="activeTab.set('access')">Access</button>
            <button type="button" [class.active]="activeTab() === 'audit'" (click)="activeTab.set('audit')">Audit</button>
          </div>

          <div class="detail-content">
            @if (activeTab() === 'overview') {
              <div class="detail-section">
                <h3>Identity</h3>
                <div class="detail-grid">
                  <div>
                    <span>Full name</span>
                    <strong>{{ student.fullName }}</strong>
                  </div>
                  <div>
                    <span>Date of birth</span>
                    <strong>{{ student.dateOfBirth | date }}</strong>
                  </div>
                  <div>
                    <span>Gender</span>
                    <strong>{{ student.gender | titlecase }}</strong>
                  </div>
                  <div>
                    <span>Nationality</span>
                    <strong>{{ student.nationality || '—' }}</strong>
                  </div>
                </div>
              </div>
              <div class="detail-section">
                <h3>Enrollment</h3>
                <div class="detail-grid">
                  <div>
                    <span>Academic year</span>
                    <strong>{{ student.enrollment.academicYear }}</strong>
                  </div>
                  <div>
                    <span>Grade</span>
                    <strong>{{ student.enrollment.class }}</strong>
                  </div>
                  <div>
                    <span>Section</span>
                    <strong>{{ student.enrollment.section || '—' }}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{{ student.status | titlecase }}</strong>
                  </div>
                </div>
              </div>
              <div class="detail-section">
                <h3>Primary guardian</h3>
                <div class="detail-grid">
                  <div>
                    <span>Name</span>
                    <strong>{{ primaryGuardianName(student) }}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{{ primaryGuardianPhone(student) }}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{{ primaryGuardianEmail(student) }}</strong>
                  </div>
                </div>
              </div>
            }

            @if (activeTab() === 'enrollment') {
              <div class="detail-section">
                <h3>Current placement</h3>
                <div class="detail-grid">
                  <div>
                    <span>Academic year</span>
                    <strong>{{ student.enrollment.academicYear }}</strong>
                  </div>
                  <div>
                    <span>Grade</span>
                    <strong>{{ student.enrollment.class }}</strong>
                  </div>
                  <div>
                    <span>Section</span>
                    <strong>{{ student.enrollment.section || '—' }}</strong>
                  </div>
                  <div>
                    <span>Admission date</span>
                    <strong>{{ student.enrollment.admissionDate | date }}</strong>
                  </div>
                </div>
              </div>
              <div class="detail-section">
                <h3>Enrollment history</h3>
                <div class="detail-placeholder">
                  <p>No history available.</p>
                </div>
              </div>
            }

            @if (activeTab() === 'guardians') {
              <div class="detail-section">
                <h3>Guardians</h3>
                <div class="detail-table">
                  <div class="detail-table__header">
                    <span>Name</span>
                    <span>Relationship</span>
                    <span>Phone</span>
                    <span>Email</span>
                  </div>
                  <div class="detail-table__row" *ngFor="let guardian of student.guardians || []">
                    <span>{{ guardian.name }}</span>
                    <span>{{ guardian.relationship | titlecase }}</span>
                    <span>{{ guardian.phone }}</span>
                    <span>{{ guardian.email || '—' }}</span>
                  </div>
                </div>
              </div>
            }

            @if (activeTab() === 'documents') {
              <div class="detail-section">
                <h3>Documents</h3>
                <div class="detail-table">
                  <div class="detail-table__header">
                    <span>Document</span>
                    <span>Type</span>
                    <span>Uploaded</span>
                  </div>
                  <div class="detail-table__row" *ngFor="let doc of student.documents || []">
                    <span>{{ doc.name }}</span>
                    <span>{{ doc.type }}</span>
                    <span>{{ doc.uploadedAt | date }}</span>
                  </div>
                  @if ((student.documents || []).length === 0) {
                    <div class="detail-placeholder">
                      <p>No documents uploaded.</p>
                    </div>
                  }
                </div>
              </div>
            }

            @if (activeTab() === 'access') {
              <div class="detail-section">
                <h3>Access & Accounts</h3>
                <div class="detail-grid">
                  <div>
                    <span>Student portal</span>
                    <strong>Not created</strong>
                  </div>
                  <div>
                    <span>Guardian portal</span>
                    <strong>Disabled</strong>
                  </div>
                </div>
              </div>
            }

            @if (activeTab() === 'audit') {
              <div class="detail-section">
                <h3>Audit log</h3>
                <div class="detail-placeholder">
                  <p>No audit events yet.</p>
                </div>
              </div>
            }
          </div>
        </aside>
      </div>

      <app-modal *ngIf="createModalOpen()" (close)="closeCreateModal()">
        <app-student-form (close)="closeCreateModal()"></app-student-form>
      </app-modal>

      @if (bulkArchiveOpen()) {
        <div class="modal-overlay" (click)="closeBulkModals()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3>Archive students</h3>
                <p>Archives {{ selectedIds().size }} student records.</p>
              </div>
              <ui-button size="sm" variant="ghost" (click)="closeBulkModals()">✕</ui-button>
            </div>
            <div class="modal-body">
              <p>This removes students from active class rosters.</p>
              <label>
                Type ARCHIVE to confirm
                <ui-input [(value)]="bulkConfirmText"></ui-input>
              </label>
            </div>
            <div class="modal-footer">
              <ui-button size="sm" variant="ghost" (click)="closeBulkModals()">Cancel</ui-button>
              <ui-button size="sm" variant="danger" [disabled]="bulkConfirmText !== 'ARCHIVE'" (click)="confirmBulkArchive()">
                Archive students
              </ui-button>
            </div>
          </div>
        </div>
      }

      @if (bulkStatusOpen()) {
        <div class="modal-overlay" (click)="closeBulkModals()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3>Update status</h3>
                <p>Apply a new status to {{ selectedIds().size }} students.</p>
              </div>
              <ui-button size="sm" variant="ghost" (click)="closeBulkModals()">✕</ui-button>
            </div>
            <div class="modal-body">
              <label>
                Status
                <select [(ngModel)]="bulkStatusValue">
                  <option *ngFor="let status of statuses" [value]="status">{{ status | titlecase }}</option>
                </select>
              </label>
            </div>
            <div class="modal-footer">
              <ui-button size="sm" variant="ghost" (click)="closeBulkModals()">Cancel</ui-button>
              <ui-button size="sm" variant="primary" (click)="confirmBulkStatus()">Update status</ui-button>
            </div>
          </div>
        </div>
      }

      @if (bulkAssignOpen()) {
        <div class="modal-overlay" (click)="closeBulkModals()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3>Assign section</h3>
                <p>Assign a class/section to {{ selectedIds().size }} students.</p>
              </div>
              <ui-button size="sm" variant="ghost" (click)="closeBulkModals()">✕</ui-button>
            </div>
            <div class="modal-body">
              <label>
                Class/Section
                <select [(ngModel)]="bulkSectionValue">
                  <option *ngFor="let group of classSections" [value]="group">{{ group }}</option>
                </select>
              </label>
            </div>
            <div class="modal-footer">
              <ui-button size="sm" variant="ghost" (click)="closeBulkModals()">Cancel</ui-button>
              <ui-button size="sm" variant="primary" (click)="confirmBulkAssign()">Assign</ui-button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class StudentsListComponent implements OnInit {
  constructor(
    private readonly studentsService: StudentService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  loading = signal(true);
  error = signal<string | null>(null);
  students = signal<Student[]>([]);

  searchTerm = signal('');
  statusFilter = '';
  gradeFilter = '';
  classFilter = '';
  yearFilter = '';

  page = signal(1);
  pageSize = signal(25);

  selectedIds = signal<Set<string>>(new Set());
  selectedStudentId = signal<string | null>(null);
  activeTab = signal<'overview' | 'enrollment' | 'guardians' | 'documents' | 'access' | 'audit'>('overview');

  addMenuOpen = signal(false);
  overflowOpen = signal(false);
  rowMenuOpen = signal<string | null>(null);
  createModalOpen = signal(false);
  bulkArchiveOpen = signal(false);
  bulkStatusOpen = signal(false);
  bulkAssignOpen = signal(false);
  bulkConfirmText = '';
  bulkStatusValue: StudentStatus = StudentStatus.ACTIVE;
  bulkSectionValue = '';

  statuses = Object.values(StudentStatus);
  grades = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
  classSections = ['A', 'B', 'C', 'Blue', 'Red'];
  academicYears = ['2023/2024', '2024/2025', '2025/2026'];

  filteredStudents = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.students().filter((student) => {
      if (term) {
        const match = [
          student.fullName,
          student.enrollment.admissionNumber,
          this.primaryGuardianPhone(student),
          this.primaryGuardianEmail(student),
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
        if (!match) {
          return false;
        }
      }

      if (this.statusFilter && student.status !== this.statusFilter) {
        return false;
      }
      if (this.gradeFilter && student.enrollment.class !== this.gradeFilter) {
        return false;
      }
      if (this.classFilter && student.enrollment.section !== this.classFilter) {
        return false;
      }
      if (this.yearFilter && student.enrollment.academicYear !== this.yearFilter) {
        return false;
      }

      return true;
    });
  });

  pagedStudents = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredStudents().slice(start, start + this.pageSize());
  });

  totalPages = computed(() => {
    const total = Math.max(this.filteredStudents().length, 1);
    return Math.ceil(total / this.pageSize());
  });

  selectedStudent = computed(() => {
    const id = this.selectedStudentId();
    if (!id) {
      return null;
    }
    return this.students().find((student) => student.id === id) || null;
  });

  ngOnInit(): void {
    this.loadStudents();
    this.route.queryParamMap.subscribe((params) => {
      const id = params.get('studentId');
      if (id) {
        this.selectedStudentId.set(id);
      }
    });
  }

  loadStudents(): void {
    this.loading.set(true);
    this.error.set(null);
    this.studentsService.getStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load students.');
        this.loading.set(false);
      }
    });
  }

  updateSearch(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
  }

  applyFilters(): void {
    this.page.set(1);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter = '';
    this.gradeFilter = '';
    this.classFilter = '';
    this.yearFilter = '';
    this.page.set(1);
  }

  hasFilters(): boolean {
    return !!(this.searchTerm() || this.statusFilter || this.gradeFilter || this.classFilter || this.yearFilter);
  }

  toggleSelectAll(checked: boolean): void {
    if (!checked) {
      this.selectedIds.set(new Set());
      return;
    }
    const ids = new Set(this.pagedStudents().map((student) => student.id));
    this.selectedIds.set(ids);
  }

  toggleSelectRow(id: string, checked: boolean): void {
    const next = new Set(this.selectedIds());
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.selectedIds.set(next);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  allSelected(): boolean {
    const pageIds = this.pagedStudents().map((student) => student.id);
    return pageIds.length > 0 && pageIds.every((id) => this.selectedIds().has(id));
  }

  selectStudent(student: Student): void {
    this.selectedStudentId.set(student.id);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { studentId: student.id },
      queryParamsHandling: 'merge',
    });
  }

  closeDetail(): void {
    this.selectedStudentId.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { studentId: null },
      queryParamsHandling: 'merge',
    });
  }

  toggleAddMenu(event: Event): void {
    event.stopPropagation();
    this.addMenuOpen.set(!this.addMenuOpen());
  }

  toggleOverflow(event: Event): void {
    event.stopPropagation();
    this.overflowOpen.set(!this.overflowOpen());
  }

  toggleRowMenu(event: Event, id: string): void {
    event.stopPropagation();
    this.rowMenuOpen.set(this.rowMenuOpen() === id ? null : id);
  }

  openCreateModal(): void {
    this.createModalOpen.set(true);
    this.addMenuOpen.set(false);
    this.logAction('student_create_opened');
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
  }

  openImport(): void {
    this.addMenuOpen.set(false);
  }

  exportStudents(): void {
    this.overflowOpen.set(false);
  }

  openSavedViews(): void {
    this.overflowOpen.set(false);
  }

  bulkHelp(): void {
    this.overflowOpen.set(false);
  }

  bulkAssign(): void {
    this.bulkAssignOpen.set(true);
  }

  bulkStatus(): void {
    this.bulkStatusOpen.set(true);
  }

  bulkExport(): void {}

  bulkArchive(): void {
    this.bulkConfirmText = '';
    this.bulkArchiveOpen.set(true);
  }

  editStudent(event: Event, id: string): void {
    event.stopPropagation();
    this.router.navigate(['/students', id, 'edit']);
  }

  openTransfer(event: Event, _student: Student): void {
    event.stopPropagation();
  }

  openPromote(event: Event, _student: Student): void {
    event.stopPropagation();
  }

  archiveStudent(event: Event, _student: Student): void {
    event.stopPropagation();
    this.logAction('student_archive_opened');
  }

  formatUpdated(date: Date): string {
    if (!date) {
      return '—';
    }
    return new Date(date).toLocaleDateString();
  }

  initials(name: string): string {
    if (!name) return '—';
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  primaryGuardianName(student?: Student | null): string {
    if (!student) return '—';
    return student.primaryGuardian?.name || student.guardians?.[0]?.name || '—';
  }

  primaryGuardianPhone(student?: Student | null): string {
    if (!student) return '—';
    return student.primaryGuardian?.phone || student.guardians?.[0]?.phone || '—';
  }

  primaryGuardianEmail(student?: Student | null): string {
    if (!student) return '—';
    return student.primaryGuardian?.email || student.guardians?.[0]?.email || '—';
  }

  handleKeydown(event: KeyboardEvent): void {
    if (!this.pagedStudents().length) {
      return;
    }
    const currentIndex = this.pagedStudents().findIndex((student) => student.id === this.selectedStudentId());
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, this.pagedStudents().length - 1);
      this.selectStudent(this.pagedStudents()[nextIndex]);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
      this.selectStudent(this.pagedStudents()[nextIndex]);
    }
    if (event.key === 'Escape') {
      this.closeDetail();
    }
  }

  toggleColumns(): void {}

  closeBulkModals(): void {
    this.bulkArchiveOpen.set(false);
    this.bulkStatusOpen.set(false);
    this.bulkAssignOpen.set(false);
  }

  confirmBulkArchive(): void {
    this.closeBulkModals();
    this.selectedIds.set(new Set());
    this.logAction('students_bulk_archived');
  }

  confirmBulkStatus(): void {
    this.closeBulkModals();
    this.logAction('students_bulk_status_updated');
  }

  confirmBulkAssign(): void {
    this.closeBulkModals();
    this.logAction('students_bulk_assigned');
  }

  prevPage(): void {
    this.page.set(Math.max(1, this.page() - 1));
  }

  nextPage(): void {
    this.page.set(Math.min(this.totalPages(), this.page() + 1));
  }

  logAction(action: string): void {
    console.log('[Students]', action);
  }

}
