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
  MbDrawerComponent,
  MbInputComponent,
  MbModalComponent,
  MbModalFooterDirective,
  MbSelectComponent,
  MbSelectOption,
  MbSplitButtonComponent,
  MbSplitButtonItem,
  MbTableActionsDirective,
  MbTableColumn,
  MbTableComponent,
} from '@mindbloom/ui';

type QueueKey =
  | 'all'
  | 'needs-attention'
  | 'active';

type AttentionFilter = 'missing-docs' | 'missing-guardian' | 'inactive';

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
    MbDrawerComponent,
    StudentFormComponent,
    CanDirective,
  ],
  styleUrls: ['./students-list.component.scss'],
  template: `
    <div class="students-hub">
      <header class="hub-header">
        <div class="hub-title">
          <h1>Student Workflow Center</h1>
          <p>Process student records and resolve next actions.</p>
        </div>
        <div class="hub-actions">
          <mb-button
            class="workflow-toggle"
            size="sm"
            variant="tertiary"
            (click)="openWorkflowDrawer()">
            Workflow panel
          </mb-button>
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

      <div class="hub-controls">
        <mb-input
          [value]="searchTerm()"
          placeholder="Search by name, student ID, admission no., guardian phone/email"
          (valueChange)="updateSearch($event)">
        </mb-input>
        <div class="scope-filters">
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
      </div>

      <div class="hub-body">
        <section class="list-panel" (keydown)="handleKeydown($event)">
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

          <div class="attention-filters">
            <span class="attention-label">Attention filters</span>
            <div class="attention-list">
              <mb-button
                class="attention-pill"
                size="sm"
                variant="tertiary"
                *ngFor="let filter of attentionFiltersList()"
                [class.active]="attentionFilters().has(filter.key)"
                (click)="toggleAttentionFilter(filter.key)">
                {{ filter.label }}
                <span class="queue-count">{{ filter.count }}</span>
              </mb-button>
            </div>
            <mb-button
              size="sm"
              variant="tertiary"
              *ngIf="hasAttentionFilters()"
              (click)="clearAttentionFilters()">
              Clear attention
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
                <p>No students yet</p>
                <span>Add your first student or import from Excel/CSV.</span>
                <div class="empty-actions">
                  <mb-button size="sm" variant="primary" *can="'students.create'" (click)="openCreateModal()">Add student</mb-button>
                  <mb-button size="sm" variant="tertiary" *can="'students.create'" (click)="openImport()">Import CSV</mb-button>
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

        <aside class="workflow-panel">
          <ng-container *ngTemplateOutlet="workflowPanel"></ng-container>
        </aside>
      </div>

      <ng-template #workflowPanel>
        <div class="workflow-section">
          <div class="workflow-header">
            <h3>Quick actions</h3>
            @if (selectedStudent()) {
              <p class="workflow-meta">For {{ selectedStudent()?.fullName }}</p>
            } @else {
              <p class="workflow-meta">Select a student to enable actions.</p>
            }
          </div>
          <div class="actions-list">
            <mb-button size="sm" variant="tertiary" [disabled]="!selectedStudent()">Print ID card</mb-button>
            <mb-button size="sm" variant="tertiary" [disabled]="!selectedStudent()">Generate admission letter</mb-button>
            <mb-button size="sm" variant="tertiary" [disabled]="!selectedStudent()">Move class/section</mb-button>
            <mb-button size="sm" variant="tertiary" [disabled]="!selectedStudent()">Update guardian</mb-button>
            <mb-button size="sm" variant="tertiary" [disabled]="!selectedStudent()">Add medical note</mb-button>
            <mb-button size="sm" variant="tertiary" [disabled]="!selectedStudent()">Add incident</mb-button>
          </div>
        </div>
        <div class="workflow-section">
          <div class="workflow-header">
            <h3>Timeline & activity</h3>
            @if (selectedStudent()) {
              <p class="workflow-meta">No activity yet.</p>
            } @else {
              <p class="workflow-meta">Select a student to view activity.</p>
            }
          </div>
        </div>
      </ng-template>

      <mb-drawer
        [open]="workflowDrawerOpen()"
        title="Workflow panel"
        (closed)="closeWorkflowDrawer()">
        <ng-container *ngTemplateOutlet="workflowPanel"></ng-container>
      </mb-drawer>

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
  activeQueue = signal<QueueKey>('needs-attention');
  attentionFilters = signal<Set<AttentionFilter>>(new Set());
  workflowDrawerOpen = signal(false);

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
    const needsAttention = students.filter((student) => this.needsAction(student));
    return [
      { key: 'needs-attention', label: 'Needs attention', count: needsAttention.length },
      { key: 'active', label: 'Active', count: students.filter((student) => student.status === StudentStatus.ACTIVE).length },
      { key: 'all', label: 'All', count: students.length },
    ];
  });

  attentionFiltersList = computed(() => {
    const students = this.students();
    return [
      { key: 'missing-docs' as const, label: 'Missing documents', count: students.filter((student) => this.hasMissingDocs(student)).length },
      { key: 'missing-guardian' as const, label: 'No guardian', count: students.filter((student) => this.hasMissingGuardian(student)).length },
      { key: 'inactive' as const, label: 'Inactive', count: students.filter((student) => student.status === StudentStatus.INACTIVE).length },
    ];
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
      label: 'Status',
      cell: (student) => this.titleCase(student.status),
    },
    {
      key: 'flags',
      label: 'Attention',
      cell: (student) => {
        const flags = this.previewFlags(student);
        return flags.length ? flags.join(' · ') : '—';
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

      if (!this.matchesAttentionFilters(student)) {
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
      case 'active':
        return student.status === StudentStatus.ACTIVE;
      case 'needs-attention':
        return this.needsAction(student);
      default:
        return true;
    }
  }

  toggleAttentionFilter(filter: AttentionFilter): void {
    const next = new Set(this.attentionFilters());
    if (next.has(filter)) {
      next.delete(filter);
    } else {
      next.add(filter);
    }
    this.attentionFilters.set(next);
    this.page.set(1);
  }

  clearAttentionFilters(): void {
    this.attentionFilters.set(new Set());
    this.page.set(1);
  }

  hasAttentionFilters(): boolean {
    return this.attentionFilters().size > 0;
  }

  matchesAttentionFilters(student: Student): boolean {
    const filters = this.attentionFilters();
    if (filters.size === 0) {
      return true;
    }
    if (filters.has('missing-docs') && this.hasMissingDocs(student)) {
      return true;
    }
    if (filters.has('missing-guardian') && this.hasMissingGuardian(student)) {
      return true;
    }
    if (filters.has('inactive') && student.status === StudentStatus.INACTIVE) {
      return true;
    }
    return false;
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

  nextActions(student: Student): string[] {
    if (this.hasMissingGuardian(student)) {
      return ['Add a guardian', 'Verify guardian contact'];
    }
    if (this.hasMissingDocs(student)) {
      return ['Request missing documents', 'Mark documents received'];
    }
    if (student.status === StudentStatus.INACTIVE) {
      return ['Complete enrollment', 'Assign class/section'];
    }
    if (student.status === StudentStatus.SUSPENDED) {
      return ['Review suspension', 'Add incident notes'];
    }
    if (student.status === StudentStatus.WITHDRAWN) {
      return ['Confirm withdrawal details', 'Archive record'];
    }
    return ['Update profile details', 'Review guardians'];
  }

  openWorkflowDrawer(): void {
    this.workflowDrawerOpen.set(true);
  }

  closeWorkflowDrawer(): void {
    this.workflowDrawerOpen.set(false);
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
    this.clearAttentionFilters();
    this.page.set(1);
  }

  hasFilters(): boolean {
    return !!(this.searchTerm() || this.gradeFilter || this.classFilter || this.yearFilter || this.hasAttentionFilters());
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
