import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../../../core/services/student.service';
import { Student, StudentStatus } from '../../../../core/models/student.model';
import { StudentFormComponent } from '../../../setup/pages/students/student-form/student-form.component';
import { CanDirective } from '../../../../shared/security/can.directive';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import {
  MbButtonComponent,
  MbModalComponent,
  MbModalFooterDirective,
  MbSelectComponent,
  MbSplitButtonComponent,
  MbTableActionsDirective,
  MbTableColumn,
  MbTableComponent,
  MbSelectOption,
  MbSplitButtonItem,
} from '@mindbloom/ui';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MbButtonComponent,
    MbSelectComponent,
    MbSplitButtonComponent,
    MbTableComponent,
    MbTableActionsDirective,
    MbModalComponent,
    MbModalFooterDirective,
    StudentFormComponent,
    SearchInputComponent,
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
          <mb-split-button
            *can="'students.create'"
            label="Add student"
            size="sm"
            variant="primary"
            [items]="addStudentItems"
            (primaryClick)="openCreateModal()"
            (itemSelect)="handleAddMenu($event)">
          </mb-split-button>
          <mb-button size="sm" variant="tertiary" (click)="toggleColumns()">Columns</mb-button>
          <div class="overflow" [class.open]="overflowOpen()">
            <mb-button size="sm" variant="tertiary" (click)="toggleOverflow($event)">•••</mb-button>
            <div class="overflow-menu" *ngIf="overflowOpen()">
              <mb-button
                size="sm"
                variant="tertiary"
                [fullWidth]="true"
                *can="'students.export'"
                (click)="exportStudents()">
                Export CSV
              </mb-button>
              <mb-button size="sm" variant="tertiary" [fullWidth]="true" (click)="openSavedViews()">
                Saved views
              </mb-button>
              <mb-button size="sm" variant="tertiary" [fullWidth]="true" (click)="bulkHelp()">
                Bulk actions
              </mb-button>
            </div>
          </div>
        </div>
      </header>

      <div class="directory-layout">
        <section class="directory-panel" (keydown)="handleKeydown($event)">
          <div class="directory-filters">
            <div class="search-row">
              <app-search-input
                placeholder="Search by name, student ID, admission no., guardian phone/email"
                (search)="updateSearch($event)">
              </app-search-input>
              <span class="result-count">{{ filteredStudents().length }} students</span>
            </div>
            <div class="filter-row">
              <mb-select
                [options]="statusOptions"
                [(ngModel)]="statusFilter"
                (valueChange)="applyFilters()">
              </mb-select>
              <mb-select
                [options]="gradeOptions"
                [(ngModel)]="gradeFilter"
                (valueChange)="applyFilters()">
              </mb-select>
              <mb-select
                [options]="classOptions"
                [(ngModel)]="classFilter"
                (valueChange)="applyFilters()">
              </mb-select>
              <mb-select
                [options]="yearOptions"
                [(ngModel)]="yearFilter"
                (valueChange)="applyFilters()">
              </mb-select>
              <mb-button
                class="clear-filters"
                size="sm"
                variant="tertiary"
                *ngIf="hasFilters()"
                (click)="clearFilters()">
                Clear all
              </mb-button>
            </div>
          </div>

          <div class="bulk-bar" *ngIf="selectedIds().size">
            <span>{{ selectedIds().size }} selected</span>
            <div class="bulk-actions">
              <mb-button size="sm" variant="tertiary" *can="'students.write'" (click)="bulkAssign()">Assign section</mb-button>
              <mb-button size="sm" variant="tertiary" *can="'students.write'" (click)="bulkStatus()">Update status</mb-button>
              <mb-button size="sm" variant="tertiary" *can="'students.export'" (click)="bulkExport()">Export selected</mb-button>
              <mb-button size="sm" variant="danger" *can="'students.delete'" (click)="bulkArchive()">Archive</mb-button>
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
              <mb-button size="sm" variant="tertiary" (click)="loadStudents()">Retry</mb-button>
            </div>
          }

          @if (!loading() && !error()) {
            @if (filteredStudents().length === 0) {
              <div class="empty-state">
                <p>No students found</p>
                <span>Try adjusting your filters or search terms.</span>
                <div class="empty-actions">
                  <mb-button size="sm" variant="tertiary" (click)="clearFilters()">Clear filters</mb-button>
                  <mb-button size="sm" variant="primary" *can="'students.create'" (click)="openCreateModal()">Add student</mb-button>
                </div>
              </div>
            } @else {
              <div class="table-wrapper">
                <mb-table
                  *ngIf="tableVisible()"
                  [rows]="pagedStudents()"
                  [columns]="tableColumns()"
                  [rowKey]="rowKey"
                  [rowClass]="rowClass"
                  [selectable]="true"
                  [sortLocal]="false"
                  emptyMessage="No students available."
                  (rowClick)="selectStudent($event)"
                  (selectionChange)="onSelectionChange($event)"
                >
                  <ng-template mbTableActions let-student>
                    <div class="row-actions" [class.open]="rowMenuOpen() === student.id">
                      <mb-button size="sm" variant="tertiary" (click)="toggleRowMenu($event, student.id)">•••</mb-button>
                      <div class="row-menu" *ngIf="rowMenuOpen() === student.id">
                        <mb-button size="sm" variant="tertiary" [fullWidth]="true" (click)="selectStudent(student)">
                          View details
                        </mb-button>
                        <mb-button
                          size="sm"
                          variant="tertiary"
                          [fullWidth]="true"
                          *can="'students.update'"
                          (click)="editStudent($event, student.id)">
                          Edit student
                        </mb-button>
                        <mb-button
                          size="sm"
                          variant="tertiary"
                          [fullWidth]="true"
                          *can="'students.write'"
                          (click)="openTransfer($event, student)">
                          Transfer student
                        </mb-button>
                        <mb-button
                          size="sm"
                          variant="tertiary"
                          [fullWidth]="true"
                          *can="'students.write'"
                          (click)="openPromote($event, student)">
                          Promote student
                        </mb-button>
                        <mb-button
                          size="sm"
                          variant="danger"
                          [fullWidth]="true"
                          *can="'students.delete'"
                          (click)="archiveStudent($event, student)">
                          Archive
                        </mb-button>
                      </div>
                    </div>
                  </ng-template>
                </mb-table>
              </div>

              <div class="pagination">
                <span>Page {{ page() }} of {{ totalPages() }}</span>
                <div class="pagination-actions">
                  <mb-button size="sm" variant="tertiary" (click)="prevPage()" [disabled]="page() === 1">Previous</mb-button>
                  <mb-button size="sm" variant="tertiary" (click)="nextPage()" [disabled]="page() === totalPages()">Next</mb-button>
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
              <mb-button size="sm" variant="tertiary" *can="'students.update'" (click)="editStudent($event, student.id)">Edit</mb-button>
              <mb-button size="sm" variant="tertiary" (click)="closeDetail()">Close</mb-button>
            </div>
          </div>

          <div class="detail-tabs">
            <mb-button
              class="tab-button"
              size="sm"
              variant="tertiary"
              [class.active]="activeTab() === 'overview'"
              (click)="activeTab.set('overview')">
              Overview
            </mb-button>
            <mb-button
              class="tab-button"
              size="sm"
              variant="tertiary"
              [class.active]="activeTab() === 'enrollment'"
              (click)="activeTab.set('enrollment')">
              Enrollment
            </mb-button>
            <mb-button
              class="tab-button"
              size="sm"
              variant="tertiary"
              [class.active]="activeTab() === 'guardians'"
              (click)="activeTab.set('guardians')">
              Guardians
            </mb-button>
            <mb-button
              class="tab-button"
              size="sm"
              variant="tertiary"
              [class.active]="activeTab() === 'documents'"
              (click)="activeTab.set('documents')">
              Documents
            </mb-button>
            <mb-button
              class="tab-button"
              size="sm"
              variant="tertiary"
              [class.active]="activeTab() === 'access'"
              (click)="activeTab.set('access')">
              Access
            </mb-button>
            <mb-button
              class="tab-button"
              size="sm"
              variant="tertiary"
              [class.active]="activeTab() === 'audit'"
              (click)="activeTab.set('audit')">
              Audit
            </mb-button>
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

      <mb-modal
        [open]="createModalOpen()"
        title="Add student"
        (closed)="closeCreateModal()"
        [hasFooter]="false">
        <app-student-form (close)="closeCreateModal()"></app-student-form>
      </mb-modal>

      <mb-modal
        [open]="bulkArchiveOpen()"
        title="Archive students"
        (closed)="closeBulkModals()"
        [hasFooter]="true">
        <p>Archives {{ selectedIds().size }} student records.</p>
        <p>This removes students from active class rosters.</p>
        <label>
          Type ARCHIVE to confirm
          <mb-input [(ngModel)]="bulkConfirmText"></mb-input>
        </label>
        <div mbModalFooter>
          <mb-button size="sm" variant="tertiary" (click)="closeBulkModals()">Cancel</mb-button>
          <mb-button size="sm" variant="danger" [disabled]="bulkConfirmText !== 'ARCHIVE'" (click)="confirmBulkArchive()">
            Archive students
          </mb-button>
        </div>
      </mb-modal>

      <mb-modal
        [open]="bulkStatusOpen()"
        title="Update status"
        (closed)="closeBulkModals()"
        [hasFooter]="true">
        <p>Apply a new status to {{ selectedIds().size }} students.</p>
        <label>
          Status
          <mb-select [options]="bulkStatusOptions" [(ngModel)]="bulkStatusValue"></mb-select>
        </label>
        <div mbModalFooter>
          <mb-button size="sm" variant="tertiary" (click)="closeBulkModals()">Cancel</mb-button>
          <mb-button size="sm" variant="primary" (click)="confirmBulkStatus()">Update status</mb-button>
        </div>
      </mb-modal>

      <mb-modal
        [open]="bulkAssignOpen()"
        title="Assign section"
        (closed)="closeBulkModals()"
        [hasFooter]="true">
        <p>Assign a class/section to {{ selectedIds().size }} students.</p>
        <label>
          Class/Section
          <mb-select [options]="bulkClassOptions" [(ngModel)]="bulkSectionValue"></mb-select>
        </label>
        <div mbModalFooter>
          <mb-button size="sm" variant="tertiary" (click)="closeBulkModals()">Cancel</mb-button>
          <mb-button size="sm" variant="primary" (click)="confirmBulkAssign()">Assign</mb-button>
        </div>
      </mb-modal>
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

  overflowOpen = signal(false);
  rowMenuOpen = signal<string | null>(null);
  createModalOpen = signal(false);
  bulkArchiveOpen = signal(false);
  bulkStatusOpen = signal(false);
  bulkAssignOpen = signal(false);
  tableVisible = signal(true);
  bulkConfirmText = '';
  bulkStatusValue: StudentStatus = StudentStatus.ACTIVE;
  bulkSectionValue = '';

  statuses = Object.values(StudentStatus);
  grades = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
  classSections = ['A', 'B', 'C', 'Blue', 'Red'];
  academicYears = ['2023/2024', '2024/2025', '2025/2026'];

  addStudentItems: MbSplitButtonItem[] = [
    { label: 'Add student', value: 'create' },
    { label: 'Import CSV', value: 'import' },
  ];

  statusOptions: MbSelectOption[] = [
    { label: 'All statuses', value: '' },
    ...this.statuses.map((status) => ({ label: this.titleCase(status), value: status })),
  ];
  gradeOptions: MbSelectOption[] = [
    { label: 'All grades', value: '' },
    ...this.grades.map((grade) => ({ label: grade, value: grade })),
  ];
  classOptions: MbSelectOption[] = [
    { label: 'All sections', value: '' },
    ...this.classSections.map((group) => ({ label: group, value: group })),
  ];
  yearOptions: MbSelectOption[] = [
    { label: 'All years', value: '' },
    ...this.academicYears.map((year) => ({ label: year, value: year })),
  ];
  bulkStatusOptions: MbSelectOption[] = this.statuses.map((status) => ({
    label: this.titleCase(status),
    value: status,
  }));
  bulkClassOptions: MbSelectOption[] = this.classSections.map((group) => ({
    label: group,
    value: group,
  }));

  tableColumns = computed<MbTableColumn<Student>[]>(() => [
    {
      key: 'name',
      label: 'Student',
      sortable: true,
      cell: (student) => ({
        primary: student.fullName,
        secondary: `ID · ${student.enrollment.admissionNumber || '—'}`,
        icon: { symbol: this.initials(student.fullName), title: student.fullName },
      }),
    },
    {
      key: 'grade',
      label: 'Grade',
      cell: (student) => student.enrollment.class || '—',
    },
    {
      key: 'section',
      label: 'Class/Section',
      cell: (student) =>
        student.enrollment.class
          ? `${student.enrollment.class}${student.enrollment.section ? ' · ' + student.enrollment.section : ''}`
          : '—',
    },
    {
      key: 'status',
      label: 'Status',
      cell: (student) => this.titleCase(student.status),
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      cell: (student) => this.formatUpdated(student.updatedAt),
    },
  ]);

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
    this.logAction('student_create_opened');
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
  }

  openImport(): void {
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
    this.resetTableSelection();
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

  handleAddMenu(value: string): void {
    if (value === 'create') {
      this.openCreateModal();
    }
    if (value === 'import') {
      this.openImport();
    }
  }

  rowKey = (student: Student) => student.id;

  rowClass = (student: Student) =>
    this.selectedStudentId() === student.id ? 'is-selected' : '';

  onSelectionChange(selected: Student[]): void {
    this.selectedIds.set(new Set(selected.map((student) => student.id)));
  }

  resetTableSelection(): void {
    this.tableVisible.set(false);
    setTimeout(() => this.tableVisible.set(true));
  }

  titleCase(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
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
