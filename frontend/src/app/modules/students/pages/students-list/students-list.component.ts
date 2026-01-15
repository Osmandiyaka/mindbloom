import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { StudentService } from '../../../../core/services/student.service';
import { Student, StudentActivityItem, StudentFilters, StudentStatus } from '../../../../core/models/student.model';
import { StudentFormComponent } from '../../../setup/pages/students/student-form/student-form.component';
import { CanDirective } from '../../../../shared/security/can.directive';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';
import { EditionService } from '../../../../shared/services/entitlements.service';
import { MODULE_KEYS, ModuleKey } from '../../../../shared/types/module-keys';
import { RbacService } from '../../../../core/rbac/rbac.service';
import { PERMISSIONS } from '../../../../core/rbac/permission.constants';
import { TenantContextService } from '../../../../core/tenant/tenant-context.service';
import { StudentColumnConfig } from '../../config/student-columns.schema';
import {
  MbButtonComponent,
  MbCheckboxComponent,
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

type AttentionFilter = 'missing-docs' | 'missing-guardian' | 'inactive';
type FilterChip = { key: string; label: string; type: 'search' | 'status' | 'grade' | 'section' | 'year' | 'attention' };
type QuickAction = {
  key: string;
  label: string;
  helper: string;
  icon: string;
  permission: string;
  moduleKey: ModuleKey;
  primary: boolean;
};
type ActivityFilter = 'all' | 'enrollment' | 'documents' | 'guardians' | 'system';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DragDropModule,
    MbButtonComponent,
    MbCheckboxComponent,
    MbSelectComponent,
    MbSplitButtonComponent,
    MbTableComponent,
    MbTableActionsDirective,
    MbModalComponent,
    MbModalFooterDirective,
    MbDrawerComponent,
    MbInputComponent,
    StudentFormComponent,
    SearchInputComponent,
    CanDirective,
    TooltipDirective,
  ],
  styleUrls: ['./students-list.component.scss'],
  template: `
    <div class="students-hub">
      <header class="hub-header">
        <div class="hub-title">
          <h1>{{ headerCopy.title }}</h1>
          <p>{{ headerCopy.subtitle }}</p>
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
            [label]="headerCopy.addStudent"
            size="sm"
            variant="primary"
            [items]="addStudentItems"
            (primaryClick)="openCreateModal()"
            (itemSelect)="handleAddMenu($event)">
          </mb-split-button>
          <mb-button size="sm" variant="tertiary" (click)="toggleColumns()">{{ headerCopy.columns }}</mb-button>
          <div class="overflow" [class.open]="overflowOpen()">
            <mb-button size="sm" variant="tertiary" (click)="toggleOverflow($event)">•••</mb-button>
            <div class="overflow-menu" *ngIf="overflowOpen()">
              <mb-button
                size="sm"
                variant="tertiary"
                [fullWidth]="true"
                *can="'students.export'"
                (click)="exportStudents()">
                {{ headerCopy.exportCsv }}
              </mb-button>
              <mb-button size="sm" variant="tertiary" [fullWidth]="true" (click)="openSavedViews()">
                {{ headerCopy.savedViews }}
              </mb-button>
              <mb-button
                size="sm"
                variant="tertiary"
                [fullWidth]="true"
                *can="'setup.write'"
                (click)="manageStudentIds()">
                {{ headerCopy.manageStudentIds }}
              </mb-button>
            </div>
          </div>
        </div>
      </header>

      <div class="hub-controls">
        <app-search-input
          [value]="searchTerm()"
          placeholder="Search by name, student ID, admission no., guardian phone/email"
          (search)="updateSearch($event)">
        </app-search-input>
        <div class="scope-filters">
          <mb-select
            [options]="statusOptions()"
            [(ngModel)]="statusFilter"
            (valueChange)="applyFilters()">
          </mb-select>
          <mb-select
            [options]="gradeOptions()"
            [(ngModel)]="gradeFilter"
            (valueChange)="applyFilters()">
          </mb-select>
          <mb-select
            [options]="classOptions()"
            [(ngModel)]="classFilter"
            (valueChange)="applyFilters()">
          </mb-select>
          <mb-select
            [options]="yearOptions()"
            [(ngModel)]="yearFilter"
            (valueChange)="applyFilters()">
          </mb-select>
          <mb-select
            [options]="pageSizeOptions"
            [(ngModel)]="pageSizeValue"
            (valueChange)="setPageSize($event)">
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
      <div class="active-filters" *ngIf="activeFilterChips().length">
        <span class="active-label">Filters</span>
        <div class="chip-list">
          <mb-button
            class="filter-chip"
            size="sm"
            variant="tertiary"
            *ngFor="let chip of activeFilterChips()"
            (click)="removeFilterChip(chip)">
            {{ chip.label }} ✕
          </mb-button>
        </div>
        <mb-button size="sm" variant="tertiary" (click)="clearFilters()">Clear all</mb-button>
      </div>

      <div class="hub-body">
        <section class="list-panel" (keydown)="handleKeydown($event)">
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
            <div class="table-skeleton">
              <div class="skeleton-row" *ngFor="let _ of skeletonRows"></div>
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
                  [rows]="filteredStudents()"
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
                        <mb-button size="sm" variant="tertiary" [fullWidth]="true" (click)="viewStudent($event, student)">
                          View student
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
                          (click)="openChangeSection($event, student)">
                          Change section
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
                <span>Page {{ page() }}</span>
                <div class="pagination-actions">
                  <mb-button size="sm" variant="tertiary" (click)="prevPage()" [disabled]="page() === 1">Previous</mb-button>
                  <mb-button size="sm" variant="tertiary" (click)="nextPage()" [disabled]="!hasNextPage()">Next</mb-button>
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
        <div class="workflow-summary">
          @if (panelLoading()) {
            <div class="panel-skeleton">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          } @else if (panelStudent()) {
            <div class="summary-title">
              <h3>{{ panelStudent()?.fullName }}</h3>
              <span class="status-pill">{{ titleCase(panelStudent()?.status || '') }}</span>
            </div>
            <p class="summary-meta">ID · {{ panelStudent()?.enrollment?.admissionNumber || '—' }}</p>
          } @else {
            <p class="summary-empty">Select a student to see actions and timeline.</p>
          }
        </div>
        <div class="workflow-section">
          <div class="workflow-header">
            <div class="workflow-header-text">
              <h3>Quick actions</h3>
              @if (panelStudent()) {
                <p class="workflow-meta">For {{ panelStudent()?.fullName }}</p>
              } @else {
                <p class="workflow-meta">Select a student to enable actions.</p>
              }
            </div>
            <div class="quick-actions-menu" [class.open]="quickActionsMenuOpen()">
              <mb-button size="sm" variant="tertiary" (click)="toggleQuickActionsMenu($event)">•••</mb-button>
              <div class="quick-actions-menu-panel" *ngIf="quickActionsMenuOpen()">
                <div
                  class="quick-actions-menu-item"
                  *ngFor="let action of secondaryQuickActions()"
                  [appTooltip]="actionTooltip(action)"
                  tooltipPosition="left">
                  <mb-button
                    size="sm"
                    variant="tertiary"
                    [fullWidth]="true"
                    [disabled]="!isActionEnabled(action)"
                    (click)="runQuickAction(action)">
                    {{ action.label }}
                  </mb-button>
                </div>
              </div>
            </div>
          </div>
          <div class="actions-list">
            <div
              class="quick-action"
              *ngFor="let action of primaryQuickActions()"
              [appTooltip]="actionTooltip(action)"
              tooltipPosition="left">
              <mb-button
                size="sm"
                variant="tertiary"
                [fullWidth]="true"
                [disabled]="!isActionEnabled(action)"
                (click)="runQuickAction(action)">
                <span class="action-icon" aria-hidden="true">{{ action.icon }}</span>
                <span class="action-text">
                  <span class="action-label">{{ action.label }}</span>
                  <span class="action-helper">{{ action.helper }}</span>
                </span>
              </mb-button>
            </div>
          </div>
        </div>
        <div class="workflow-section">
          <div class="workflow-header">
            <div class="workflow-header-text">
              <h3>Timeline</h3>
              @if (!selectedStudent()) {
                <p class="workflow-meta">Select a student to view activity.</p>
              }
            </div>
          </div>
          <div class="timeline-filters">
            <mb-button
              size="sm"
              variant="tertiary"
              *ngFor="let filter of activityFilters"
              [class.active]="activityFilter() === filter.value"
              (click)="setActivityFilter(filter.value)">
              {{ filter.label }}
            </mb-button>
          </div>
          <div class="timeline-list">
            @if (!panelStudent()) {
              <div class="timeline-empty">No activity to show.</div>
            } @else if (activityLoading()) {
              <div class="timeline-skeleton">
                <div class="skeleton-row" *ngFor="let _ of skeletonRows"></div>
              </div>
            } @else if (activityError()) {
              <div class="timeline-error">
                <p>{{ activityError() }}</p>
                <mb-button size="sm" variant="tertiary" (click)="loadActivity(true)">Retry</mb-button>
              </div>
            } @else if (activityItems().length === 0) {
              <div class="timeline-empty">No activity recorded.</div>
            } @else {
              <div class="timeline-items">
                <mb-button
                  *ngFor="let item of activityItems()"
                  size="sm"
                  variant="tertiary"
                  [fullWidth]="true"
                  class="timeline-item"
                  (click)="openActivityDetail(item)">
                  <div class="timeline-item-text">
                    <div class="timeline-title">{{ item.title }}</div>
                    <div class="timeline-meta">
                      <span>{{ formatActivityTime(item.createdAt) }}</span>
                      <span *ngIf="item.actor">· {{ item.actor }}</span>
                    </div>
                    <div class="timeline-detail" *ngIf="item.metadata">{{ item.metadata }}</div>
                  </div>
                </mb-button>
              </div>
              <div class="timeline-load" *ngIf="activityHasNext()">
                <mb-button size="sm" variant="tertiary" (click)="loadMoreActivity()">Load more</mb-button>
              </div>
            }
          </div>
          <div class="activity-detail" *ngIf="activityDetailOpen()">
            <div class="activity-detail-header">
              <div>
                <h4>{{ selectedActivity()?.title }}</h4>
                <p>{{ formatActivityTime(selectedActivity()?.createdAt) }}</p>
              </div>
              <mb-button size="sm" variant="tertiary" (click)="closeActivityDetail()">Close</mb-button>
            </div>
            <p class="activity-detail-meta" *ngIf="selectedActivity()?.actor">
              Actor: {{ selectedActivity()?.actor }}
            </p>
            <p class="activity-detail-body" *ngIf="selectedActivity()?.metadata">
              {{ selectedActivity()?.metadata }}
            </p>
          </div>
        </div>
      </ng-template>

      <mb-drawer
        [open]="workflowDrawerOpen()"
        title="Workflow panel"
        (closed)="closeWorkflowDrawer()">
        <ng-container *ngTemplateOutlet="workflowPanel"></ng-container>
      </mb-drawer>

      <mb-drawer
        [open]="columnsDrawerOpen()"
        [title]="columnCopy.title"
        (closed)="closeColumnsDrawer()">
        <div class="columns-drawer">
          <app-search-input
            [value]="columnSearch()"
            [placeholder]="columnCopy.searchPlaceholder"
            (search)="updateColumnSearch($event)">
          </app-search-input>
          <div class="columns-actions">
            <mb-button size="sm" variant="tertiary" (click)="resetColumns()">{{ columnCopy.reset }}</mb-button>
            <mb-button size="sm" variant="primary" (click)="saveColumns()">{{ columnCopy.saveDefault }}</mb-button>
          </div>
          <div class="columns-list" cdkDropList (cdkDropListDropped)="onColumnDrop($event)">
            <div class="columns-item" *ngFor="let col of filteredColumns()" cdkDrag>
              <span class="drag-handle" cdkDragHandle>⋮⋮</span>
              <mb-checkbox [checked]="col.visible" (checkedChange)="toggleColumn(col.key)">
                {{ col.label }}
              </mb-checkbox>
            </div>
          </div>
        </div>
      </mb-drawer>

      <mb-drawer
        [open]="detailDrawerOpen()"
        title="Student details"
        (closed)="closeDetailDrawer()">
        @if (selectedStudent()) {
          <div class="detail-panel">
            <div class="detail-header">
              <h3>{{ selectedStudent()?.fullName }}</h3>
              <span class="detail-meta">ID · {{ selectedStudent()?.enrollment?.admissionNumber || '—' }}</span>
            </div>
            <div class="detail-section">
              <h4>Status</h4>
              <p>{{ titleCase(selectedStudent()?.status || '') }}</p>
            </div>
            <div class="detail-section">
              <h4>Enrollment</h4>
              <p>{{ selectedStudent()?.enrollment?.academicYear || '—' }}</p>
              <p>
                {{ selectedStudent()?.enrollment?.class || '—' }}
                {{ selectedStudent()?.enrollment?.section ? ' · ' + selectedStudent()?.enrollment?.section : '' }}
              </p>
            </div>
            <div class="detail-section">
              <h4>Primary guardian</h4>
              <p>{{ primaryGuardianName(selectedStudent()) }}</p>
              <p>{{ primaryGuardianPhone(selectedStudent()) }}</p>
              <p>{{ primaryGuardianEmail(selectedStudent()) }}</p>
            </div>
          </div>
        } @else {
          <p class="detail-empty">Select a student to view details.</p>
        }
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
          <mb-select [options]="bulkStatusOptions()" [(ngModel)]="bulkStatusValue"></mb-select>
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
          <mb-select [options]="bulkClassOptions()" [(ngModel)]="bulkSectionValue"></mb-select>
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
    private readonly rbac: RbacService,
    private readonly entitlements: EditionService,
    private readonly tenantContext: TenantContextService,
  ) {}

  loading = signal(true);
  error = signal<string | null>(null);
  students = signal<Student[]>([]);
  filterSource = signal<Student[]>([]);

  searchTerm = signal('');
  statusFilter = '';
  gradeFilter = '';
  classFilter = '';
  yearFilter = '';

  page = signal(1);
  pageSize = signal(25);
  pageSizeValue = '25';

  selectedIds = signal<Set<string>>(new Set());
  selectedStudentId = signal<string | null>(null);
  attentionFilters = signal<Set<AttentionFilter>>(new Set());
  workflowDrawerOpen = signal(false);
  detailDrawerOpen = signal(false);
  quickActionsMenuOpen = signal(false);
  detailLoading = signal(false);
  activityFilter = signal<ActivityFilter>('all');
  activityItems = signal<StudentActivityItem[]>([]);
  activityLoading = signal(false);
  activityError = signal<string | null>(null);
  activityPage = signal(1);
  activityHasNext = signal(false);
  activityDetailOpen = signal(false);
  selectedActivity = signal<StudentActivityItem | null>(null);

  overflowOpen = signal(false);
  rowMenuOpen = signal<string | null>(null);
  createModalOpen = signal(false);
  bulkArchiveOpen = signal(false);
  bulkStatusOpen = signal(false);
  bulkAssignOpen = signal(false);
  columnsDrawerOpen = signal(false);
  columnSearch = signal('');
  columnSchema = signal<StudentColumnConfig[]>([]);
  columnConfig = signal<Array<StudentColumnConfig & { visible: boolean }>>([]);
  tableVisible = signal(true);
  bulkConfirmText = '';
  bulkStatusValue: StudentStatus = StudentStatus.ACTIVE;
  bulkSectionValue = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  skeletonRows = Array.from({ length: 8 });

  pageSizeOptions: MbSelectOption[] = [
    { label: '25 / page', value: '25' },
    { label: '50 / page', value: '50' },
    { label: '100 / page', value: '100' },
  ];

  statuses = Object.values(StudentStatus);

  headerCopy = {
    title: 'Students',
    subtitle: 'Search, manage, and process student records.',
    addStudent: 'Add student',
    importCsv: 'Import CSV',
    columns: 'Columns',
    exportCsv: 'Export CSV',
    savedViews: 'Saved views',
    manageStudentIds: 'Manage student IDs',
  };

  columnCopy = {
    title: 'Columns',
    searchPlaceholder: 'Search columns',
    reset: 'Reset',
    saveDefault: 'Save as default',
  };

  addStudentItems: MbSplitButtonItem[] = [
    { label: this.headerCopy.addStudent, value: 'create' },
    { label: this.headerCopy.importCsv, value: 'import' },
  ];

  quickActions = computed<QuickAction[]>(() => [
    {
      key: 'add-note',
      label: 'Add note',
      helper: 'Capture updates or context.',
      icon: 'N',
      permission: PERMISSIONS.students.write,
      moduleKey: MODULE_KEYS.STUDENTS,
      primary: true,
    },
    {
      key: 'upload-doc',
      label: 'Upload document',
      helper: 'Attach student documents.',
      icon: 'D',
      permission: PERMISSIONS.students.write,
      moduleKey: MODULE_KEYS.STUDENTS,
      primary: true,
    },
    {
      key: 'assign-guardian',
      label: 'Assign guardian',
      helper: 'Link parent or guardian.',
      icon: 'G',
      permission: PERMISSIONS.students.update,
      moduleKey: MODULE_KEYS.STUDENTS,
      primary: true,
    },
    {
      key: 'change-section',
      label: 'Change section',
      helper: 'Move to another class.',
      icon: 'S',
      permission: PERMISSIONS.students.write,
      moduleKey: MODULE_KEYS.STUDENTS,
      primary: true,
    },
    {
      key: 'start-transfer',
      label: 'Start transfer',
      helper: 'Begin transfer workflow.',
      icon: 'T',
      permission: PERMISSIONS.students.write,
      moduleKey: MODULE_KEYS.STUDENTS,
      primary: false,
    },
    {
      key: 'invite-guardian',
      label: 'Invite guardian',
      helper: 'Create portal access.',
      icon: 'A',
      permission: PERMISSIONS.students.update,
      moduleKey: MODULE_KEYS.STUDENTS,
      primary: false,
    },
  ]);

  primaryQuickActions = computed(() => this.quickActions().filter((action) => action.primary));
  secondaryQuickActions = computed(() => this.quickActions().filter((action) => !action.primary));

  activityFilters = [
    { label: 'All', value: 'all' as ActivityFilter },
    { label: 'Enrollment', value: 'enrollment' as ActivityFilter },
    { label: 'Documents', value: 'documents' as ActivityFilter },
    { label: 'Guardians', value: 'guardians' as ActivityFilter },
    { label: 'System', value: 'system' as ActivityFilter },
  ];

  statusOptions = computed<MbSelectOption[]>(() => {
    const values = this.uniqueValues(this.filterSource().map((student) => student.status));
    const options = values.length ? values : this.statuses;
    return [{ label: 'All statuses', value: '' }, ...options.map((status) => ({ label: this.titleCase(status), value: status }))];
  });

  gradeOptions = computed<MbSelectOption[]>(() => {
    const values = this.uniqueValues(this.filterSource().map((student) => student.enrollment.class));
    return [{ label: 'All grades', value: '' }, ...values.map((grade) => ({ label: grade, value: grade }))];
  });

  classOptions = computed<MbSelectOption[]>(() => {
    const values = this.uniqueValues(this.filterSource().map((student) => student.enrollment.section).filter(Boolean) as string[]);
    return [{ label: 'All sections', value: '' }, ...values.map((section) => ({ label: section, value: section }))];
  });

  yearOptions = computed<MbSelectOption[]>(() => {
    const values = this.uniqueValues(this.filterSource().map((student) => student.enrollment.academicYear));
    return [{ label: 'All years', value: '' }, ...values.map((year) => ({ label: year, value: year }))];
  });

  bulkStatusOptions = computed<MbSelectOption[]>(() =>
    (this.uniqueValues(this.filterSource().map((student) => student.status)).length
      ? this.uniqueValues(this.filterSource().map((student) => student.status))
      : this.statuses
    ).map((status) => ({ label: this.titleCase(status), value: status })),
  );

  bulkClassOptions = computed<MbSelectOption[]>(() => {
    const values = this.uniqueValues(this.filterSource().map((student) => student.enrollment.section).filter(Boolean) as string[]);
    return values.map((section) => ({ label: section, value: section }));
  });

  attentionFiltersList = computed(() => {
    const students = this.filterSource();
    return [
      { key: 'missing-docs' as const, label: 'Missing documents', count: students.filter((student) => this.hasMissingDocs(student)).length },
      { key: 'missing-guardian' as const, label: 'No guardian', count: students.filter((student) => this.hasMissingGuardian(student)).length },
      { key: 'inactive' as const, label: 'Inactive', count: students.filter((student) => student.status === StudentStatus.INACTIVE).length },
    ];
  });

  tableColumns = computed<MbTableColumn<Student>[]>(() => {
    const columns = this.columnConfig().length ? this.columnConfig() : this.defaultColumnConfig();
    return columns
      .filter((column) => column.visible)
      .map((column) => this.buildColumn(column));
  });

  filteredStudents = computed(() => {
    return this.students().filter((student) => {
      if (!this.matchesAttentionFilters(student)) {
        return false;
      }

      return true;
    });
  });

  activeFilterChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.searchTerm()) {
      chips.push({ key: 'search', label: `Search: ${this.searchTerm()}`, type: 'search' });
    }
    if (this.statusFilter) {
      chips.push({ key: 'status', label: `Status: ${this.titleCase(this.statusFilter)}`, type: 'status' });
    }
    if (this.gradeFilter) {
      chips.push({ key: 'grade', label: `Grade: ${this.gradeFilter}`, type: 'grade' });
    }
    if (this.classFilter) {
      chips.push({ key: 'section', label: `Section: ${this.classFilter}`, type: 'section' });
    }
    if (this.yearFilter) {
      chips.push({ key: 'year', label: `Year: ${this.yearFilter}`, type: 'year' });
    }
    const attentionMap = new Map(this.attentionFiltersList().map((filter) => [filter.key, filter.label]));
    this.attentionFilters().forEach((filter) => {
      const label = attentionMap.get(filter) || filter;
      chips.push({ key: filter, label: `Attention: ${label}`, type: 'attention' });
    });
    return chips;
  });

  toggleAttentionFilter(filter: AttentionFilter): void {
    const next = new Set(this.attentionFilters());
    if (next.has(filter)) {
      next.delete(filter);
    } else {
      next.add(filter);
    }
    this.attentionFilters.set(next);
    this.page.set(1);
    this.updateQueryParams();
  }

  clearAttentionFilters(): void {
    this.attentionFilters.set(new Set());
    this.page.set(1);
    this.updateQueryParams();
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

  removeFilterChip(chip: FilterChip): void {
    if (chip.type === 'search') {
      this.searchTerm.set('');
    }
    if (chip.type === 'status') {
      this.statusFilter = '';
    }
    if (chip.type === 'grade') {
      this.gradeFilter = '';
    }
    if (chip.type === 'section') {
      this.classFilter = '';
    }
    if (chip.type === 'year') {
      this.yearFilter = '';
    }
    if (chip.type === 'attention') {
      this.toggleAttentionFilter(chip.key as AttentionFilter);
      return;
    }
    this.updateQueryParams();
  }

  private buildStudentFilters(): StudentFilters {
    return {
      search: this.searchTerm() || undefined,
      status: this.statusFilter || undefined,
      class: this.gradeFilter || undefined,
      section: this.classFilter || undefined,
      academicYear: this.yearFilter || undefined,
      page: this.page(),
      pageSize: this.pageSize(),
    };
  }

  private updateQueryParams(): void {
    const attention = this.serializeAttentionFilters();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.searchTerm() || null,
        status: this.statusFilter || null,
        grade: this.gradeFilter || null,
        section: this.classFilter || null,
        year: this.yearFilter || null,
        page: this.page(),
        pageSize: this.pageSize(),
        attention: attention || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private serializeAttentionFilters(): string {
    return Array.from(this.attentionFilters()).join(',');
  }

  private isAttentionFilter(value: string): value is AttentionFilter {
    return value === 'missing-docs' || value === 'missing-guardian' || value === 'inactive';
  }

  private uniqueValues(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean))).sort();
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

  openDetailDrawer(): void {
    this.detailDrawerOpen.set(true);
  }

  closeDetailDrawer(): void {
    this.detailDrawerOpen.set(false);
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

  selectedStudent = computed(() => {
    const id = this.selectedStudentId();
    if (!id) {
      return null;
    }
    return this.students().find((student) => student.id === id) || null;
  });

  panelStudent = computed(() => this.selectedStudentDetail() || this.selectedStudent());

  panelLoading = computed(() => {
    if (!this.selectedStudentId()) {
      return false;
    }
    return this.loading() || this.detailLoading() || this.activityLoading();
  });

  selectedStudentDetail = signal<Student | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const id = params.get('studentId');
      this.selectedStudentId.set(id);
      if (!id) {
        this.selectedStudentDetail.set(null);
        this.detailLoading.set(false);
        this.activityItems.set([]);
        this.activityDetailOpen.set(false);
      }
      this.searchTerm.set(params.get('search') || '');
      this.statusFilter = params.get('status') || '';
      this.gradeFilter = params.get('grade') || '';
      this.classFilter = params.get('section') || '';
      this.yearFilter = params.get('year') || '';
      const pageParam = Number(params.get('page'));
      const pageSizeParam = Number(params.get('pageSize'));
      if (!Number.isNaN(pageParam) && pageParam > 0) {
        this.page.set(pageParam);
      }
      if (!Number.isNaN(pageSizeParam) && pageSizeParam > 0) {
        this.pageSize.set(pageSizeParam);
        this.pageSizeValue = String(pageSizeParam);
      }
      const attention = params.get('attention');
      this.attentionFilters.set(
        attention
          ? new Set(
              attention
                .split(',')
                .map((value) => value.trim())
                .filter((value): value is AttentionFilter => this.isAttentionFilter(value))
            )
          : new Set()
      );
      this.loadStudents();
      this.loadActivity(true);
    });
    this.loadFilterOptions();
    this.loadColumnConfig();
  }

  loadStudents(): void {
    this.loading.set(true);
    this.error.set(null);
    this.studentsService.getStudents(this.buildStudentFilters()).subscribe({
      next: (students) => {
        this.students.set(students);
        if (this.selectedStudentId() && !students.some((student) => student.id === this.selectedStudentId())) {
          this.loadSelectedStudentDetail(this.selectedStudentId()!);
        } else if (this.selectedStudentId()) {
          const matched = students.find((student) => student.id === this.selectedStudentId());
          if (matched) {
            this.selectedStudentDetail.set(matched);
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load students.');
        this.loading.set(false);
      }
    });
  }

  loadFilterOptions(): void {
    this.studentsService.getStudents().subscribe({
      next: (students) => {
        this.filterSource.set(students);
      },
      error: () => {
        this.filterSource.set([]);
      }
    });
  }

  updateSearch(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.updateQueryParams(), 300);
  }

  applyFilters(): void {
    this.page.set(1);
    this.updateQueryParams();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter = '';
    this.gradeFilter = '';
    this.classFilter = '';
    this.yearFilter = '';
    this.attentionFilters.set(new Set());
    this.page.set(1);
    this.updateQueryParams();
  }

  hasFilters(): boolean {
    return !!(
      this.searchTerm() ||
      this.statusFilter ||
      this.gradeFilter ||
      this.classFilter ||
      this.yearFilter ||
      this.hasAttentionFilters()
    );
  }

  setPageSize(value: string): void {
    const size = Number(value);
    if (Number.isNaN(size) || size <= 0) {
      return;
    }
    this.pageSize.set(size);
    this.pageSizeValue = value;
    this.page.set(1);
    this.updateQueryParams();
  }

  hasNextPage(): boolean {
    return this.students().length === this.pageSize();
  }

  selectStudent(student: Student): void {
    this.selectedStudentId.set(student.id);
    this.selectedStudentDetail.set(student);
    this.detailLoading.set(false);
    this.activityPage.set(1);
    this.activityItems.set([]);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { studentId: student.id },
      queryParamsHandling: 'merge',
    });
  }

  closeDetail(): void {
    this.selectedStudentId.set(null);
    this.detailDrawerOpen.set(false);
    this.activityItems.set([]);
    this.activityDetailOpen.set(false);
    this.selectedStudentDetail.set(null);
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

  toggleColumns(): void {
    this.columnsDrawerOpen.set(true);
  }

  closeColumnsDrawer(): void {
    this.columnsDrawerOpen.set(false);
  }

  updateColumnSearch(value: string): void {
    this.columnSearch.set(value);
  }

  filteredColumns = computed(() => {
    const term = this.columnSearch().trim().toLowerCase();
    const columns = this.columnConfig().length ? this.columnConfig() : this.defaultColumnConfig();
    if (!term) {
      return columns;
    }
    return columns.filter((column) => column.label.toLowerCase().includes(term));
  });

  toggleColumn(key: string): void {
    const next = this.columnConfig().length ? [...this.columnConfig()] : this.defaultColumnConfig();
    const index = next.findIndex((column) => column.key === key);
    if (index === -1) {
      return;
    }
    next[index] = { ...next[index], visible: !next[index].visible };
    this.columnConfig.set(next);
  }

  onColumnDrop(event: CdkDragDrop<Array<StudentColumnConfig & { visible: boolean }>>): void {
    const next = [...this.columnConfig()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.columnConfig.set(next);
  }

  saveColumns(): void {
    this.persistColumns(this.columnConfig());
    this.columnsDrawerOpen.set(false);
  }

  resetColumns(): void {
    const defaults = this.defaultColumnConfig();
    this.columnConfig.set(defaults);
    this.persistColumns(defaults);
  }

  loadColumnConfig(): void {
    this.studentsService.getStudentColumns().subscribe({
      next: (schema) => {
        this.columnSchema.set(schema);
        const saved = this.readPersistedColumns(schema);
        this.columnConfig.set(saved);
      },
      error: () => {
        const stored = this.readStoredColumns();
        if (stored?.length) {
          this.columnConfig.set(stored);
        } else {
          this.columnConfig.set(this.defaultColumnConfig());
        }
      }
    });
  }

  private defaultColumnConfig(): Array<StudentColumnConfig & { visible: boolean }> {
    const schema = this.columnSchema();
    if (!schema.length) {
      return this.columnConfig().length ? this.columnConfig() : [];
    }
    return schema.map((column) => ({ ...column, visible: column.defaultVisible }));
  }

  private buildColumn(column: StudentColumnConfig): MbTableColumn<Student> {
    switch (column.key) {
      case 'name':
        return {
          key: 'name',
          label: column.label,
          sortable: true,
          cell: (student) => ({
            primary: student.fullName,
            secondary: `ID · ${student.enrollment.admissionNumber || '—'}`,
            meta: student.enrollment.class
              ? `${student.enrollment.class}${student.enrollment.section ? ' · ' + student.enrollment.section : ''}`
              : '—',
            icon: { symbol: this.initials(student.fullName), title: student.fullName },
          }),
        };
      case 'grade':
        return {
          key: 'grade',
          label: column.label,
          cell: (student) => student.enrollment.class || '—',
        };
      case 'section':
        return {
          key: 'section',
          label: column.label,
          cell: (student) => student.enrollment.section || '—',
        };
      case 'status':
        return {
          key: 'status',
          label: column.label,
          cell: (student) => this.titleCase(student.status),
        };
      case 'flags':
        return {
          key: 'flags',
          label: column.label,
          cell: (student) => {
            const flags = this.previewFlags(student);
            return flags.length ? flags.join(' · ') : '—';
          },
        };
      case 'updated':
        return {
          key: 'updated',
          label: column.label,
          cell: (student) => this.formatUpdated(student.updatedAt),
        };
      default:
        return {
          key: column.key,
          label: column.label,
          cell: () => '—',
        };
    }
  }

  private persistColumns(columns: Array<StudentColumnConfig & { visible: boolean }>): void {
    try {
      const storageKey = this.columnsStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(columns));
    } catch (error) {
      console.warn('[Students] Failed to save column preferences', error);
    }
  }

  private readPersistedColumns(schema: StudentColumnConfig[]): Array<StudentColumnConfig & { visible: boolean }> {
    const defaults = schema.map((column) => ({ ...column, visible: column.defaultVisible }));
    try {
      const stored = localStorage.getItem(this.columnsStorageKey());
      if (!stored) {
        return defaults;
      }
      const parsed = JSON.parse(stored) as Array<StudentColumnConfig & { visible: boolean }>;
      const schemaMap = new Map(schema.map((column) => [column.key, column]));
      const ordered: Array<StudentColumnConfig & { visible: boolean }> = [];
      parsed.forEach((storedColumn) => {
        const schemaColumn = schemaMap.get(storedColumn.key);
        if (schemaColumn) {
          ordered.push({ ...schemaColumn, visible: storedColumn.visible ?? schemaColumn.defaultVisible });
          schemaMap.delete(storedColumn.key);
        }
      });
      schemaMap.forEach((column) => {
        ordered.push({ ...column, visible: column.defaultVisible });
      });
      return ordered;
    } catch (error) {
      console.warn('[Students] Failed to load column preferences', error);
      return defaults;
    }
  }

  private readStoredColumns(): Array<StudentColumnConfig & { visible: boolean }> | null {
    try {
      const stored = localStorage.getItem(this.columnsStorageKey());
      if (!stored) {
        return null;
      }
      const parsed = JSON.parse(stored) as Array<StudentColumnConfig & { visible: boolean }>;
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      console.warn('[Students] Failed to read stored columns', error);
      return null;
    }
  }

  private columnsStorageKey(): string {
    const tenantId = this.tenantContext.activeTenantId() || 'tenant';
    const userId = this.rbac.getSession()?.userId || 'user';
    return `students.columns.${tenantId}.${userId}`;
  }
  toggleQuickActionsMenu(event: Event): void {
    event.stopPropagation();
    this.quickActionsMenuOpen.set(!this.quickActionsMenuOpen());
  }

  toggleRowMenu(event: Event, id: string): void {
    event.stopPropagation();
    this.rowMenuOpen.set(this.rowMenuOpen() === id ? null : id);
  }

  isActionEnabled(action: QuickAction): boolean {
    if (!this.panelStudent()) {
      return false;
    }
    if (!this.entitlements.isEnabled(action.moduleKey)) {
      return false;
    }
    return this.rbac.can(action.permission as any);
  }

  actionTooltip(action: QuickAction): string {
    if (!this.panelStudent()) {
      return 'Select a student';
    }
    if (!this.entitlements.isEnabled(action.moduleKey)) {
      return 'Not available on your plan';
    }
    if (!this.rbac.can(action.permission as any)) {
      return 'You do not have permission';
    }
    return '';
  }

  runQuickAction(action: QuickAction): void {
    if (!this.isActionEnabled(action)) {
      return;
    }
    this.quickActionsMenuOpen.set(false);
    this.logAction(`student_quick_action:${action.key}`);
  }

  loadSelectedStudentDetail(id: string): void {
    this.detailLoading.set(true);
    this.studentsService.getStudent(id).subscribe({
      next: (student) => {
        this.selectedStudentDetail.set(student);
        this.detailLoading.set(false);
      },
      error: () => {
        this.selectedStudentDetail.set(null);
        this.detailLoading.set(false);
      }
    });
  }

  setActivityFilter(filter: ActivityFilter): void {
    if (this.activityFilter() === filter) {
      return;
    }
    this.activityFilter.set(filter);
    this.activityPage.set(1);
    this.activityItems.set([]);
    this.activityDetailOpen.set(false);
    this.selectedActivity.set(null);
    this.loadActivity(true);
  }

  loadActivity(reset = false): void {
    const studentId = this.selectedStudentId();
    if (!studentId) {
      this.activityItems.set([]);
      this.activityLoading.set(false);
      this.activityError.set(null);
      this.activityHasNext.set(false);
      return;
    }
    if (reset) {
      this.activityItems.set([]);
      this.activityPage.set(1);
    }
    this.activityLoading.set(true);
    this.activityError.set(null);
    const page = this.activityPage();
    const pageSize = 10;
    this.studentsService
      .getStudentActivity(studentId, { category: this.activityFilter(), page, pageSize })
      .subscribe({
        next: (items) => {
          const nextItems = page === 1 ? items : [...this.activityItems(), ...items];
          this.activityItems.set(nextItems);
          this.activityHasNext.set(items.length === pageSize);
          this.activityLoading.set(false);
        },
        error: () => {
          this.activityError.set('Could not load activity.');
          this.activityLoading.set(false);
        }
      });
  }

  loadMoreActivity(): void {
    if (this.activityLoading() || !this.activityHasNext()) {
      return;
    }
    this.activityPage.set(this.activityPage() + 1);
    this.loadActivity();
  }

  openActivityDetail(item: StudentActivityItem): void {
    this.selectedActivity.set(item);
    this.activityDetailOpen.set(true);
  }

  closeActivityDetail(): void {
    this.activityDetailOpen.set(false);
    this.selectedActivity.set(null);
  }

  formatActivityTime(date?: Date | string): string {
    if (!date) {
      return '—';
    }
    const value = typeof date === 'string' ? new Date(date) : date;
    return value.toLocaleString();
  }

  viewStudent(event: Event, student: Student): void {
    event.stopPropagation();
    this.rowMenuOpen.set(null);
    this.selectStudent(student);
    this.openDetailDrawer();
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

  manageStudentIds(): void {
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

  openChangeSection(event: Event, _student: Student): void {
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
    if (!this.filteredStudents().length) {
      return;
    }
    const currentIndex = this.filteredStudents().findIndex((student) => student.id === this.selectedStudentId());
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, this.filteredStudents().length - 1);
      this.selectStudent(this.filteredStudents()[nextIndex]);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
      this.selectStudent(this.filteredStudents()[nextIndex]);
    }
    if (event.key === 'Escape') {
      this.closeDetail();
    }
  }


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
    const next = Math.max(1, this.page() - 1);
    if (next !== this.page()) {
      this.page.set(next);
      this.updateQueryParams();
    }
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.page.set(this.page() + 1);
      this.updateQueryParams();
    }
  }

  logAction(action: string): void {
    console.log('[Students]', action);
  }

}
