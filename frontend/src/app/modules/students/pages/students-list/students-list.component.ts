import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../../../core/services/student.service';
import { Student, StudentStatus } from '../../../../core/models/student.model';
import { StudentFormComponent } from '../../../setup/pages/students/student-form/student-form.component';
import { CanDirective } from '../../../../shared/security/can.directive';
import {
  MbButtonComponent,
  MbInputComponent,
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

type QueueKey =
  | 'all'
  | 'action'
  | 'missing-docs'
  | 'missing-guardian'
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'withdrawn'
  | 'graduated'
  | 'transferred';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MbButtonComponent,
    MbInputComponent,
    MbSelectComponent,
    MbSplitButtonComponent,
    MbTableComponent,
    MbTableActionsDirective,
    MbModalComponent,
    MbModalFooterDirective,
    StudentFormComponent,
    CanDirective,
  ],
  styleUrls: ['./students-list.component.scss'],
  template: `
    <div class="students-hub">
      <header class="hub-header">
        <div class="hub-title">
          <h1>Students</h1>
          <p>Search and manage student workflows.</p>
        </div>
        <div class="hub-actions">
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

      <div class="metrics-strip">
        <div class="metric">
          <span>Active</span>
          <strong>{{ metricCounts().active }}</strong>
        </div>
        <div class="metric">
          <span>Action needed</span>
          <strong>{{ metricCounts().actionNeeded }}</strong>
        </div>
        <div class="metric">
          <span>Suspended</span>
          <strong>{{ metricCounts().suspended }}</strong>
        </div>
        <div class="metric">
          <span>Withdrawn</span>
          <strong>{{ metricCounts().withdrawn }}</strong>
        </div>
      </div>

      <div class="hub-body">
        <section class="queue-panel" (keydown)="handleKeydown($event)">
          <div class="queue-top">
            <div class="queue-title">
              <h2>Student queue</h2>
              <span>{{ filteredStudents().length }} students</span>
            </div>
            <mb-input
              [value]="searchTerm()"
              placeholder="Search by name, student ID, admission no., guardian phone/email"
              (valueChange)="updateSearch($event)">
            </mb-input>
          </div>

          <div class="queue-tabs">
            <mb-button
              class="queue-tab"
              size="sm"
              variant="tertiary"
              *ngFor="let queue of queueItems()"
              [class.active]="activeQueue() === queue.key"
              (click)="setQueue(queue.key)">
              {{ queue.label }}
              <span class="queue-count">{{ queue.count }}</span>
            </mb-button>
          </div>

          <div class="queue-filters">
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
              size="sm"
              variant="tertiary"
              *ngIf="hasFilters()"
              (click)="clearFilters()">
              Clear filters
            </mb-button>
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
                          Open
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

        <section class="preview-panel">
          <ng-container *ngIf="selectedStudent() as student; else previewEmpty">
            <div class="preview-header">
              <div>
                <h2>{{ student.fullName }}</h2>
                <p>
                  {{ student.enrollment.admissionNumber || '—' }} ·
                  {{ student.enrollment.class }}{{ student.enrollment.section ? ' · ' + student.enrollment.section : '' }} ·
                  {{ student.status | titlecase }}
                </p>
              </div>
              <div class="preview-actions">
                <mb-button size="sm" variant="primary" (click)="handlePrimaryAction(student)">
                  {{ primaryActionLabel(student) }}
                </mb-button>
                <mb-button size="sm" variant="tertiary" *can="'students.update'" (click)="editStudent($event, student.id)">
                  Edit
                </mb-button>
                <mb-button size="sm" variant="tertiary" (click)="closeDetail()">Clear</mb-button>
              </div>
            </div>

            <div class="preview-flags" *ngIf="previewFlags(student).length">
              <span class="flag" *ngFor="let flag of previewFlags(student)">{{ flag }}</span>
            </div>

            <div class="preview-grid">
              <div class="preview-card">
                <h3>Identity</h3>
                <div class="preview-list">
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

              <div class="preview-card">
                <h3>Enrollment</h3>
                <div class="preview-list">
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

              <div class="preview-card">
                <h3>Primary guardian</h3>
                <div class="preview-list">
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

              <div class="preview-card">
                <h3>Next step</h3>
                <p>{{ primaryActionHint(student) }}</p>
              </div>
            </div>
          </ng-container>
          <ng-template #previewEmpty>
            <div class="preview-empty">
              <p>Select a student to view their workflow.</p>
            </div>
          </ng-template>
        </section>

        <aside class="actions-panel">
          <div class="actions-card">
            <h3>Quick actions</h3>
            <div class="actions-list">
              <mb-button size="sm" variant="tertiary" [disabled]="!selectedStudent()">Print ID card</mb-button>
              <mb-button size="sm" variant="tertiary" [disabled]="!selectedStudent()">Generate admission letter</mb-button>
              <mb-button size="sm" variant="tertiary" [disabled]="!selectedStudent()">Move class/section</mb-button>
              <mb-button size="sm" variant="tertiary" [disabled]="!selectedStudent()">Update guardian</mb-button>
              <mb-button size="sm" variant="tertiary" [disabled]="!selectedStudent()">Add medical note</mb-button>
              <mb-button size="sm" variant="tertiary" [disabled]="!selectedStudent()">Add incident</mb-button>
            </div>
          </div>

          <div class="actions-card">
            <h3>Activity timeline</h3>
            @if (!selectedStudent()) {
              <p class="timeline-empty">Select a student to view activity.</p>
            } @else {
              <p class="timeline-empty">No activity yet.</p>
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
  gradeFilter = '';
  classFilter = '';
  yearFilter = '';

  page = signal(1);
  pageSize = signal(25);

  selectedIds = signal<Set<string>>(new Set());
  selectedStudentId = signal<string | null>(null);
  activeQueue = signal<QueueKey>('all');

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

  queueItems = computed<Array<{ key: QueueKey; label: string; count: number }>>(() => {
    const students = this.students();
    const counts = {
      all: students.length,
      action: students.filter((student) => this.needsAction(student)).length,
      missingDocs: students.filter((student) => this.hasMissingDocs(student)).length,
      missingGuardian: students.filter((student) => this.hasMissingGuardian(student)).length,
      active: students.filter((student) => student.status === StudentStatus.ACTIVE).length,
      inactive: students.filter((student) => student.status === StudentStatus.INACTIVE).length,
      suspended: students.filter((student) => student.status === StudentStatus.SUSPENDED).length,
      withdrawn: students.filter((student) => student.status === StudentStatus.WITHDRAWN).length,
      graduated: students.filter((student) => student.status === StudentStatus.GRADUATED).length,
      transferred: students.filter((student) => student.status === StudentStatus.TRANSFERRED).length,
    };

    return [
      { key: 'all', label: 'All', count: counts.all },
      { key: 'action', label: 'Action needed', count: counts.action },
      { key: 'missing-docs', label: 'Missing documents', count: counts.missingDocs },
      { key: 'missing-guardian', label: 'No guardian', count: counts.missingGuardian },
      { key: 'active', label: 'Active', count: counts.active },
      { key: 'inactive', label: 'Inactive', count: counts.inactive },
      { key: 'suspended', label: 'Suspended', count: counts.suspended },
      { key: 'withdrawn', label: 'Withdrawn', count: counts.withdrawn },
      { key: 'graduated', label: 'Graduated', count: counts.graduated },
      { key: 'transferred', label: 'Transferred', count: counts.transferred },
    ];
  });

  metricCounts = computed(() => {
    const students = this.students();
    return {
      active: students.filter((student) => student.status === StudentStatus.ACTIVE).length,
      actionNeeded: students.filter((student) => this.needsAction(student)).length,
      suspended: students.filter((student) => student.status === StudentStatus.SUSPENDED).length,
      withdrawn: students.filter((student) => student.status === StudentStatus.WITHDRAWN).length,
    };
  });

  tableColumns = computed<MbTableColumn<Student>[]>(() => [
    {
      key: 'name',
      label: 'Student',
      sortable: true,
      cell: (student) => ({
        primary: student.fullName,
        secondary: `ID · ${student.enrollment.admissionNumber || '—'}`,
        meta: student.enrollment.class
          ? `${student.enrollment.class}${student.enrollment.section ? ' · ' + student.enrollment.section : ''}`
          : '—',
        icon: { symbol: this.initials(student.fullName), title: student.fullName },
      }),
    },
    {
      key: 'status',
      label: 'Stage',
      cell: (student) => this.titleCase(student.status),
    },
    {
      key: 'flags',
      label: 'Flags',
      cell: (student) => {
        const flags = this.previewFlags(student);
        return flags.length ? flags.join(', ') : '—';
      },
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

      if (this.gradeFilter && student.enrollment.class !== this.gradeFilter) {
        return false;
      }
      if (this.classFilter && student.enrollment.section !== this.classFilter) {
        return false;
      }
      if (this.yearFilter && student.enrollment.academicYear !== this.yearFilter) {
        return false;
      }

      if (!this.matchesQueue(student)) {
        return false;
      }

      return true;
    });
  });

  setQueue(queue: QueueKey): void {
    this.activeQueue.set(queue);
    this.page.set(1);
    this.selectedIds.set(new Set());
    this.resetTableSelection();
  }

  matchesQueue(student: Student): boolean {
    switch (this.activeQueue()) {
      case 'action':
        return this.needsAction(student);
      case 'missing-docs':
        return this.hasMissingDocs(student);
      case 'missing-guardian':
        return this.hasMissingGuardian(student);
      case 'active':
        return student.status === StudentStatus.ACTIVE;
      case 'inactive':
        return student.status === StudentStatus.INACTIVE;
      case 'suspended':
        return student.status === StudentStatus.SUSPENDED;
      case 'withdrawn':
        return student.status === StudentStatus.WITHDRAWN;
      case 'graduated':
        return student.status === StudentStatus.GRADUATED;
      case 'transferred':
        return student.status === StudentStatus.TRANSFERRED;
      default:
        return true;
    }
  }

  hasMissingDocs(student: Student): boolean {
    return (student.documents?.length ?? 0) === 0;
  }

  hasMissingGuardian(student: Student): boolean {
    return (student.guardians?.length ?? 0) === 0;
  }

  needsAction(student: Student): boolean {
    return this.hasMissingDocs(student) || this.hasMissingGuardian(student) || student.status === StudentStatus.INACTIVE;
  }

  previewFlags(student: Student): string[] {
    const flags: string[] = [];
    if (this.hasMissingGuardian(student)) {
      flags.push('No guardian');
    }
    if (this.hasMissingDocs(student)) {
      flags.push('Missing documents');
    }
    if (student.status === StudentStatus.INACTIVE) {
      flags.push('Inactive');
    }
    return flags;
  }

  primaryActionLabel(student: Student): string {
    if (this.hasMissingGuardian(student)) {
      return 'Add guardian';
    }
    if (this.hasMissingDocs(student)) {
      return 'Request documents';
    }
    if (student.status === StudentStatus.INACTIVE) {
      return 'Complete enrollment';
    }
    if (student.status === StudentStatus.SUSPENDED) {
      return 'Review suspension';
    }
    if (student.status === StudentStatus.WITHDRAWN) {
      return 'Restore student';
    }
    if (student.status === StudentStatus.GRADUATED || student.status === StudentStatus.TRANSFERRED) {
      return 'View records';
    }
    return 'Update profile';
  }

  primaryActionHint(student: Student): string {
    if (this.hasMissingGuardian(student)) {
      return 'Add a primary guardian to complete the student record.';
    }
    if (this.hasMissingDocs(student)) {
      return 'Request missing documents to finalize enrollment.';
    }
    if (student.status === StudentStatus.INACTIVE) {
      return 'Complete enrollment steps to activate this student.';
    }
    if (student.status === StudentStatus.SUSPENDED) {
      return 'Review the suspension reason and next steps.';
    }
    if (student.status === StudentStatus.WITHDRAWN) {
      return 'Restore the record if the student returns.';
    }
    if (student.status === StudentStatus.GRADUATED || student.status === StudentStatus.TRANSFERRED) {
      return 'Review historical records and academic outcomes.';
    }
    return 'Keep the profile up to date and assign next actions.';
  }

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
    this.gradeFilter = '';
    this.classFilter = '';
    this.yearFilter = '';
    this.page.set(1);
  }

  hasFilters(): boolean {
    return !!(this.searchTerm() || this.gradeFilter || this.classFilter || this.yearFilter);
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

  handlePrimaryAction(student: Student): void {
    this.logAction(`student_primary_action:${this.primaryActionLabel(student)}`);
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
