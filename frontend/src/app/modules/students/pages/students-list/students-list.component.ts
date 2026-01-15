import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { StudentService } from '../../../../core/services/student.service';
import { ToastService } from '../../../../core/ui/toast/toast.service';
import {
  Document,
  Guardian,
  RelationshipType,
  Student,
  StudentActivityItem,
  StudentAcademicSubject,
  StudentAcademicTerm,
  StudentFeeInvoice,
  StudentFeePayment,
  StudentFeeSummary,
  StudentFilterResponse,
  StudentFilters,
  StudentNote,
  StudentStatus,
} from '../../../../core/models/student.model';
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
  MbTextareaComponent,
  MbTableActionsDirective,
  MbTableColumn,
  MbTableComponent,
} from '@mindbloom/ui';

type AttentionFilter = 'missing-docs' | 'missing-guardian' | 'inactive';
type FilterChip = { key: string; label: string; type: 'search' | 'status' | 'grade' | 'section' | 'year' | 'attention' };
type DetailTabKey = 'overview' | 'guardians' | 'academics' | 'fees' | 'notes' | 'documents' | 'activity';
type DetailTab = {
  key: DetailTabKey;
  label: string;
  moduleKey?: ModuleKey;
  permission?: string;
};
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
    MbTextareaComponent,
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
          <mb-button size="sm" variant="tertiary" aria-label="Manage columns" (click)="toggleColumns()">
            {{ headerCopy.columns }}
          </mb-button>
          <div class="overflow" [class.open]="overflowOpen()">
            <mb-button size="sm" variant="tertiary" aria-label="More actions" (click)="toggleOverflow($event)">•••</mb-button>
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
        <section class="list-panel" (keydown)="handleKeydown($event)" aria-label="Students list">
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
                @if (hasFilters()) {
                  <p>No results</p>
                  <div class="empty-actions">
                    <mb-button size="sm" variant="tertiary" (click)="clearFilters()">Clear filters</mb-button>
                    <mb-button size="sm" variant="primary" *can="'students.create'" (click)="openCreateModal()">Add student</mb-button>
                  </div>
                } @else {
                  <p>No students yet</p>
                  <div class="empty-actions">
                    <mb-button size="sm" variant="tertiary" (click)="openImport()">Import CSV</mb-button>
                    <mb-button size="sm" variant="primary" *can="'students.create'" (click)="openCreateModal()">Add student</mb-button>
                  </div>
                }
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
                      <mb-button size="sm" variant="tertiary" aria-label="Row actions" (click)="toggleRowMenu($event, student.id)">•••</mb-button>
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
              <mb-button size="sm" variant="tertiary" aria-label="Quick actions menu" (click)="toggleQuickActionsMenu($event)">•••</mb-button>
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
        title=""
        panelClass="student-detail-drawer"
        backdropClass="student-detail-drawer-backdrop"
        (closed)="closeDetailDrawer()">
        <div class="detail-shell">
          @if (panelStudent()) {
            <div class="detail-header">
              <div class="detail-header-main">
                @if (detailLoading()) {
                  <div class="detail-title-row">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-pill"></div>
                  </div>
                  <div class="detail-meta-line">
                    <div class="skeleton-line skeleton-meta"></div>
                  </div>
                } @else {
                  <div class="detail-title-row">
                    <h3>{{ panelStudent()?.fullName }}</h3>
                    <span class="detail-status-pill">
                      {{ titleCase(panelStudent()?.status || '') || '—' }}
                    </span>
                  </div>
                  <div class="detail-meta-line">
                    <span>ID: {{ panelStudent()?.enrollment?.admissionNumber || '—' }}</span>
                    <span>·</span>
                    <span>{{ panelStudent()?.enrollment?.class || '—' }}</span>
                    <span *ngIf="panelStudent()?.enrollment?.section">· {{ panelStudent()?.enrollment?.section }}</span>
                    <span>·</span>
                    <span>{{ panelStudent()?.enrollment?.academicYear || '—' }}</span>
                  </div>
                }
              </div>
              <div class="detail-actions">
                <mb-button size="sm" variant="primary" *can="'students.update'" (click)="editPanelStudent()">
                  Edit
                </mb-button>
                <div class="detail-actions-menu" [class.open]="detailMenuOpen()">
                  <mb-button
                    size="sm"
                    variant="tertiary"
                    aria-label="More actions"
                    (click)="toggleDetailMenu($event)">
                    •••
                  </mb-button>
                  <div class="detail-actions-panel" *ngIf="detailMenuOpen()">
                    <mb-button size="sm" variant="tertiary" [fullWidth]="true">
                      Print profile
                    </mb-button>
                    <mb-button size="sm" variant="tertiary" [fullWidth]="true">
                      Export student
                    </mb-button>
                  </div>
                </div>
                <mb-button size="sm" variant="tertiary" aria-label="Close drawer" (click)="closeDetailDrawer()">
                  ✕
                </mb-button>
              </div>
            </div>
            <div class="detail-tabs" role="tablist">
              <mb-button
                size="sm"
                variant="tertiary"
                class="detail-tab-button"
                role="tab"
                *ngFor="let tab of visibleDetailTabs()"
                [class.active]="tab.key === selectedDetailTab()"
                [attr.aria-selected]="tab.key === selectedDetailTab()"
                (click)="selectDetailTab(tab.key)">
                <span class="detail-tab-label">
                  {{ tab.label }}
                  <span class="detail-tab-count" *ngIf="tab.key === 'guardians'">
                    {{ guardians().length }}
                  </span>
                  <span class="detail-tab-count" *ngIf="tab.key === 'documents'">
                    {{ documents().length }}
                  </span>
                  <span class="detail-tab-count" *ngIf="tab.key === 'notes'">
                    {{ notes().length }}
                  </span>
                  <span class="detail-tab-count" *ngIf="tab.key === 'activity'">
                    {{ activityItems().length }}
                  </span>
                </span>
              </mb-button>
            </div>
            <div class="detail-scroll">
              <div class="detail-summary">
                @if (detailLoading()) {
                  <div class="summary-skeleton"></div>
                  <div class="summary-skeleton"></div>
                  <div class="summary-skeleton"></div>
                  <div class="summary-skeleton"></div>
                } @else {
                  <div class="summary-strip">
                    <div class="summary-group">
                      <span class="summary-label">Enrollment</span>
                      <span class="summary-value">
                        {{ panelStudent()?.enrollment?.academicYear || '—' }} ·
                        {{ panelStudent()?.enrollment?.class || '—' }}
                        {{ panelStudent()?.enrollment?.section ? ' · ' + panelStudent()?.enrollment?.section : '' }}
                      </span>
                    </div>
                    <div class="summary-group">
                      <span class="summary-label">Status</span>
                      <span class="summary-status">{{ titleCase(panelStudent()?.status || '') || '—' }}</span>
                    </div>
                    <div class="summary-group">
                      <span class="summary-label">Last updated</span>
                      <span class="summary-value">Updated {{ formatRelativeUpdated(panelStudent()?.updatedAt) }}</span>
                    </div>
                    <div class="summary-actions">
                      <mb-button size="sm" variant="tertiary" *can="'students.write'" (click)="openChangeSectionFromPanel()">
                        Change section
                      </mb-button>
                      <mb-button size="sm" variant="tertiary" *can="'students.write'" (click)="openTransferFromPanel()">
                        Transfer
                      </mb-button>
                      <div class="summary-actions-menu" [class.open]="summaryMenuOpen()">
                        <mb-button
                          size="sm"
                          variant="tertiary"
                          aria-label="More actions"
                          (click)="toggleSummaryMenu($event)">
                          •••
                        </mb-button>
                        <div class="summary-actions-panel" *ngIf="summaryMenuOpen()">
                          <mb-button size="sm" variant="danger" [fullWidth]="true" *can="'students.delete'" (click)="archivePanelStudent()">
                            Archive
                          </mb-button>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            <div class="detail-tab-panel">
              @if (detailLoading()) {
                <div class="detail-tab-loading">
                  <div class="skeleton-card">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-row"></div>
                    <div class="skeleton-line skeleton-row"></div>
                  </div>
                  <div class="skeleton-card">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-row"></div>
                    <div class="skeleton-line skeleton-row"></div>
                  </div>
                  <div class="skeleton-card">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-row"></div>
                    <div class="skeleton-line skeleton-row"></div>
                  </div>
                </div>
              } @else {
                  @switch (selectedDetailTab()) {
                  @case ('overview') {
                      <div class="overview-grid">
                        <div class="overview-card overview-card-wide">
                          <div class="overview-card-title">Student details</div>
                          <div class="details-grid">
                            <div class="details-row">
                              <span class="detail-label">Date of birth</span>
                              <span class="detail-value">{{ formatDate(panelStudent()?.dateOfBirth) }}</span>
                            </div>
                            <div class="details-row">
                              <span class="detail-label">Gender</span>
                              <span class="detail-value">{{ titleCase(panelStudent()?.gender || '') || '—' }}</span>
                            </div>
                            <div class="details-row details-row-full">
                              <span class="detail-label">Address</span>
                              <span class="detail-value">{{ formatAddress(panelStudent()) }}</span>
                            </div>
                            <div class="details-row details-row-full">
                              <span class="detail-label">Student internal ID</span>
                              <span class="detail-value detail-copy detail-truncate" [attr.title]="panelStudent()?.id || ''">
                                {{ panelStudent()?.id || '—' }}
                                <mb-button
                                  size="sm"
                                  variant="tertiary"
                                  class="detail-copy-button"
                                  aria-label="Copy student ID"
                                  appTooltip="Copy"
                                  [disabled]="!panelStudent()?.id"
                                  (click)="copyToClipboard(panelStudent()?.id)">
                                  ⧉
                                </mb-button>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div class="overview-column">
                          <div class="overview-card">
                            <div class="overview-card-title">Primary guardian</div>
                            @if (getPrimaryGuardian(panelStudent()); as guardian) {
                              <div class="detail-grid">
                                <div class="detail-item">
                                  <span class="detail-label">Name</span>
                                  <span class="detail-value">{{ guardian.name || '—' }}</span>
                                </div>
                                <div class="detail-item">
                                  <span class="detail-label">Phone</span>
                                  <span class="detail-value guardian-phone">
                                    {{ guardian.phone || '—' }}
                                    <mb-button
                                      size="sm"
                                      variant="tertiary"
                                      class="guardian-copy"
                                      aria-label="Copy guardian phone"
                                      appTooltip="Copy"
                                      [disabled]="!guardian.phone"
                                      (click)="copyToClipboard(guardian.phone)">
                                      ⧉
                                    </mb-button>
                                  </span>
                                </div>
                                <div class="detail-item detail-item-full" *ngIf="guardian.isEmergencyContact">
                                  <span class="guardian-badge">Emergency contact</span>
                                </div>
                              </div>
                            } @else {
                              <div class="guardian-empty">
                                <span class="guardian-empty-icon" aria-hidden="true">!</span>
                                <span class="guardian-empty-text">No guardian assigned</span>
                                <mb-button size="sm" variant="tertiary" *can="'students.write'" (click)="openGuardianModal()">
                                  Add guardian
                                </mb-button>
                              </div>
                            }
                          </div>
                        </div>
                        <div class="overview-column">
                          @if (detailFlags(panelStudent()).length) {
                            <div class="overview-card overview-alerts">
                              <div class="overview-card-title">Alerts & missing info</div>
                              <div class="alert-list">
                                <div class="alert-row" *ngFor="let flag of detailFlags(panelStudent())">
                                  <span class="alert-icon" aria-hidden="true">!</span>
                                  <div class="alert-text">
                                    <span class="alert-title">{{ flag.label }}</span>
                                    <span class="alert-note">{{ flag.note }}</span>
                                  </div>
                                  <mb-button size="sm" variant="tertiary" (click)="selectDetailTab(flag.tab)">
                                    {{ flag.action }}
                                  </mb-button>
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  @case ('guardians') {
                    <div class="detail-section">
                      <div class="detail-section-header">
                        <h4>Guardians</h4>
                        <mb-button size="sm" variant="primary" *can="'students.write'" (click)="openGuardianModal()">
                          Add guardian
                        </mb-button>
                      </div>
                      @if (guardiansLoading()) {
                        <div class="detail-empty">Loading guardians…</div>
                      } @else if (guardiansError()) {
                        <div class="detail-empty">{{ guardiansError() }}</div>
                      } @else if (!guardians().length) {
                        <div class="tab-empty">
                          <span class="tab-empty-icon" aria-hidden="true">👥</span>
                          <span class="tab-empty-title">No guardians assigned</span>
                          <span class="tab-empty-note">Add a guardian to complete the student profile.</span>
                          <mb-button size="sm" variant="primary" *can="'students.write'" (click)="openGuardianModal()">
                            Add guardian
                          </mb-button>
                        </div>
                      } @else {
                        <mb-table
                          [rows]="guardians()"
                          [columns]="guardianColumns"
                          [rowKey]="guardianRowKey"
                          emptyMessage="No guardians available."
                        >
                          <ng-template mbTableActions let-guardian>
                            <div class="row-actions" [class.open]="guardianMenuOpen() === guardian.id">
                              <mb-button size="sm" variant="tertiary" aria-label="Guardian actions" (click)="toggleGuardianMenu($event, guardian.id)">•••</mb-button>
                              <div class="row-menu" *ngIf="guardianMenuOpen() === guardian.id">
                                <mb-button size="sm" variant="tertiary" [fullWidth]="true" (click)="setPrimaryGuardian(guardian)">
                                  Set primary
                                </mb-button>
                                <mb-button size="sm" variant="tertiary" [fullWidth]="true" (click)="inviteGuardian(guardian)">
                                  Invite guardian
                                </mb-button>
                                <mb-button size="sm" variant="danger" [fullWidth]="true" (click)="removeGuardian(guardian)">
                                  Remove guardian
                                </mb-button>
                              </div>
                            </div>
                          </ng-template>
                        </mb-table>
                      }
                    </div>
                  }
                  @case ('academics') {
                    @if (academicsLoading()) {
                      <p class="detail-empty">Loading academic records…</p>
                    } @else if (academicsError()) {
                      <p class="detail-empty">{{ academicsError() }}</p>
                    } @else {
                      <div class="detail-section">
                        <h4>Current classes</h4>
                        <mb-table
                          [rows]="academicsSubjects()"
                          [columns]="academicSubjectColumns"
                          emptyMessage="No classes available.">
                        </mb-table>
                      </div>
                      <div class="detail-section">
                        <div class="detail-section-header">
                          <h4>Term history</h4>
                          <mb-button size="sm" variant="tertiary">View report card</mb-button>
                        </div>
                        <mb-table
                          [rows]="academicsTerms()"
                          [columns]="academicTermColumns"
                          emptyMessage="No term records available.">
                        </mb-table>
                      </div>
                    }
                  }
                  @case ('fees') {
                    @if (feesLoading()) {
                      <p class="detail-empty">Loading fee records…</p>
                    } @else if (feesError()) {
                      <p class="detail-empty">{{ feesError() }}</p>
                    } @else {
                      <div class="detail-section">
                        <div class="fees-strip">
                          <div class="fees-metric">
                            <span class="fees-label">Current balance</span>
                            <span class="fees-value">{{ feesSummary()?.balance || '—' }}</span>
                          </div>
                          <div class="fees-metric">
                            <span class="fees-label">Paid YTD</span>
                            <span class="fees-value">{{ feesSummary()?.paidYtd || '—' }}</span>
                          </div>
                          <div class="fees-metric">
                            <span class="fees-label">Outstanding invoices</span>
                            <span class="fees-value">{{ feesSummary()?.outstandingCount ?? '—' }}</span>
                          </div>
                          <div class="fees-actions">
                            <mb-button size="sm" variant="tertiary">View in Fees</mb-button>
                            <mb-button size="sm" variant="tertiary">Export payments</mb-button>
                          </div>
                        </div>
                      </div>
                      <div class="detail-section">
                        <h4>Invoices</h4>
                        <mb-table
                          [rows]="feesInvoices()"
                          [columns]="feeInvoiceColumns"
                          emptyMessage="No invoices available.">
                        </mb-table>
                      </div>
                      <div class="detail-section">
                        <h4>Payments</h4>
                        <mb-table
                          [rows]="feesPayments()"
                          [columns]="feePaymentColumns"
                          emptyMessage="No payments available.">
                        </mb-table>
                      </div>
                    }
                  }
                  @case ('notes') {
                    <div class="detail-section">
                      <div class="detail-section-header">
                        <h4>Notes</h4>
                        <mb-button size="sm" variant="primary" (click)="openNoteModal()">Add note</mb-button>
                      </div>
                      @if (notesLoading()) {
                        <p class="detail-empty">Loading notes…</p>
                      } @else if (notesError()) {
                        <p class="detail-empty">{{ notesError() }}</p>
                      } @else if (!notes().length) {
                        <div class="tab-empty">
                          <span class="tab-empty-icon" aria-hidden="true">📝</span>
                          <span class="tab-empty-title">No notes yet</span>
                          <span class="tab-empty-note">Add the first note to keep a record of updates.</span>
                          <mb-button size="sm" variant="primary" (click)="openNoteModal()">Add note</mb-button>
                        </div>
                      } @else {
                        <div class="notes-list">
                          <div class="note-card" *ngFor="let note of notes()">
                            <div class="note-header">
                              <div>
                                <p class="note-title" *ngIf="note.title">{{ note.title }}</p>
                                <p class="note-meta">
                                  {{ formatDate(note.createdAt) }}
                                  <span *ngIf="note.author"> · {{ note.author }}</span>
                                </p>
                              </div>
                              <span class="note-visibility">{{ note.visibility || 'internal' }}</span>
                            </div>
                            <p class="note-body">{{ note.content }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  }
                  @case ('documents') {
                    <div class="detail-section">
                      <div class="detail-section-header">
                        <h4>Documents</h4>
                        <mb-button size="sm" variant="primary" (click)="openDocumentModal()">Upload document</mb-button>
                      </div>
                      @if (documentsLoading()) {
                        <div class="detail-empty">Loading documents…</div>
                      } @else if (documentsError()) {
                        <div class="detail-empty">{{ documentsError() }}</div>
                      } @else if (!documents().length) {
                        <div class="tab-empty">
                          <span class="tab-empty-icon" aria-hidden="true">📄</span>
                          <span class="tab-empty-title">No documents uploaded</span>
                          <span class="tab-empty-note">Upload required documents to complete the record.</span>
                          <mb-button size="sm" variant="primary" (click)="openDocumentModal()">Upload document</mb-button>
                        </div>
                      } @else {
                        <mb-table
                          [rows]="documents()"
                          [columns]="documentColumns"
                          emptyMessage="No documents available.">
                          <ng-template mbTableActions let-document>
                            <div class="row-actions">
                              <mb-button size="sm" variant="tertiary" aria-label="Document actions">•••</mb-button>
                            </div>
                          </ng-template>
                        </mb-table>
                      }
                    </div>
                  }
                  @case ('activity') {
                    <div class="detail-section">
                      <div class="timeline">
                        <div class="timeline-filters">
                          <mb-button
                            size="sm"
                            variant="tertiary"
                            [class.active]="activityFilter() === 'all'"
                            (click)="setActivityFilter('all')">
                            All
                          </mb-button>
                          <mb-button
                            size="sm"
                            variant="tertiary"
                            [class.active]="activityFilter() === 'enrollment'"
                            (click)="setActivityFilter('enrollment')">
                            Enrollment
                          </mb-button>
                          <mb-button
                            size="sm"
                            variant="tertiary"
                            [class.active]="activityFilter() === 'documents'"
                            (click)="setActivityFilter('documents')">
                            Documents
                          </mb-button>
                          <mb-button
                            size="sm"
                            variant="tertiary"
                            [class.active]="activityFilter() === 'guardians'"
                            (click)="setActivityFilter('guardians')">
                            Guardians
                          </mb-button>
                          <mb-button
                            size="sm"
                            variant="tertiary"
                            [class.active]="activityFilter() === 'system'"
                            (click)="setActivityFilter('system')">
                            System
                          </mb-button>
                        </div>
                        @if (activityLoading()) {
                          <div class="timeline-loading">Loading activity…</div>
                        } @else if (activityError()) {
                          <div class="timeline-error">{{ activityError() }}</div>
                        } @else if (activityItems().length === 0) {
                          <div class="tab-empty">
                            <span class="tab-empty-icon" aria-hidden="true">⏳</span>
                            <span class="tab-empty-title">No activity yet</span>
                            <span class="tab-empty-note">Activity will appear as changes are made.</span>
                          </div>
                        } @else {
                          <div class="timeline-list">
                            <div class="timeline-items">
                              <mb-button
                                size="sm"
                                variant="tertiary"
                                *ngFor="let item of activityItems()"
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
                        }
                      </div>
                    </div>
                  }
                }
              }
              </div>
            </div>
          } @else {
            <p class="detail-empty detail-empty-shell">Select a student to view details.</p>
          }
        </div>
      </mb-drawer>

      <mb-modal
        [open]="guardianModalOpen()"
        title="Add guardian"
        (closed)="closeGuardianModal()"
        [hasFooter]="true">
        <div class="modal-form">
          <label>
            Full name
            <mb-input [(ngModel)]="guardianDraft.name" placeholder="Guardian name"></mb-input>
          </label>
          <label>
            Relationship
            <mb-select [options]="guardianRelationshipOptions" [(ngModel)]="guardianDraft.relationship"></mb-select>
          </label>
          <label>
            Phone
            <mb-input [(ngModel)]="guardianDraft.phone" placeholder="Phone number"></mb-input>
          </label>
          <label>
            Email
            <mb-input [(ngModel)]="guardianDraft.email" placeholder="Email address"></mb-input>
          </label>
          <label>
            Occupation
            <mb-input [(ngModel)]="guardianDraft.occupation" placeholder="Occupation"></mb-input>
          </label>
          <div class="modal-toggle-row">
            <mb-checkbox [(ngModel)]="guardianDraft.isPrimary">Primary guardian</mb-checkbox>
            <mb-checkbox [(ngModel)]="guardianDraft.isEmergencyContact">Emergency contact</mb-checkbox>
          </div>
          <div class="modal-error" *ngIf="guardianError()">{{ guardianError() }}</div>
        </div>
        <div mbModalFooter>
          <mb-button size="sm" variant="tertiary" (click)="closeGuardianModal()">Cancel</mb-button>
          <mb-button size="sm" variant="primary" [disabled]="guardianSubmitting()" (click)="submitGuardian()">
            Save guardian
          </mb-button>
        </div>
      </mb-modal>

      <mb-modal
        [open]="noteModalOpen()"
        title="Add note"
        (closed)="closeNoteModal()"
        [hasFooter]="true">
        <div class="modal-form">
          <label>
            Title (optional)
            <mb-input [(ngModel)]="noteDraft.title" placeholder="Note title"></mb-input>
          </label>
          <label>
            Note
            <mb-textarea [(ngModel)]="noteDraft.content" placeholder="Write a note..."></mb-textarea>
          </label>
          <label>
            Visibility
            <mb-select [options]="noteVisibilityOptions" [(ngModel)]="noteDraft.visibility"></mb-select>
          </label>
          <div class="modal-error" *ngIf="notesError()">{{ notesError() }}</div>
        </div>
        <div mbModalFooter>
          <mb-button size="sm" variant="tertiary" (click)="closeNoteModal()">Cancel</mb-button>
          <mb-button size="sm" variant="primary" [disabled]="noteSubmitting()" (click)="submitNote()">
            Save note
          </mb-button>
        </div>
      </mb-modal>

      <mb-modal
        [open]="documentModalOpen()"
        title="Upload document"
        (closed)="closeDocumentModal()"
        [hasFooter]="true">
        <div class="modal-form">
          <label>
            Document type
            <mb-select [options]="documentTypeOptions" [(ngModel)]="documentDraft.type"></mb-select>
          </label>
          <label>
            File
            <input type="file" (change)="handleDocumentFile($event)" />
          </label>
          <label>
            Note (optional)
            <mb-textarea [(ngModel)]="documentDraft.note" placeholder="Add a note..."></mb-textarea>
          </label>
          <div class="modal-error" *ngIf="documentError()">{{ documentError() }}</div>
        </div>
        <div mbModalFooter>
          <mb-button size="sm" variant="tertiary" (click)="closeDocumentModal()">Cancel</mb-button>
          <mb-button size="sm" variant="primary" [disabled]="documentSubmitting()" (click)="submitDocument()">
            Upload
          </mb-button>
        </div>
      </mb-modal>

      <mb-modal
        [open]="createModalOpen()"
        title="Add student"
        (closed)="closeCreateModal()"
        [hasFooter]="false">
        <app-student-form (close)="closeCreateModal()"></app-student-form>
      </mb-modal>

      <mb-modal
        [open]="singleArchiveOpen()"
        title="Archive student"
        (closed)="closeSingleArchive()"
        [hasFooter]="true">
        <p>Archive this student record.</p>
        @if (singleArchiveLoading()) {
          <div class="state-block">
            <p>Loading impact preview…</p>
          </div>
        } @else if (singleArchiveSubmitting()) {
          <div class="state-block">
            <p>Archiving student…</p>
          </div>
        } @else if (singleArchiveError()) {
          <div class="state-block error">
            <p>{{ singleArchiveError() }}</p>
            <mb-button size="sm" variant="tertiary" (click)="openSingleArchive(selectedStudentId()!)">Retry</mb-button>
          </div>
        } @else if (singleArchiveImpact()) {
          <div class="impact-summary">
            <p>Impact preview</p>
            <span>{{ singleArchiveImpact()?.activeCount }} active enrollments</span>
            <span>{{ singleArchiveImpact()?.linkedAccountsCount }} linked accounts</span>
          </div>
        }
        @if (requiresSingleArchiveConfirm()) {
          <label>
            Type ARCHIVE to confirm
            <mb-input [(ngModel)]="singleArchiveConfirmText"></mb-input>
          </label>
        }
        <div mbModalFooter>
          <mb-button size="sm" variant="tertiary" (click)="closeSingleArchive()">Cancel</mb-button>
          <mb-button
            size="sm"
            variant="danger"
            [disabled]="!canConfirmSingleArchive()"
            (click)="confirmSingleArchive()">
            Archive student
          </mb-button>
        </div>
      </mb-modal>

      <mb-modal
        [open]="bulkArchiveOpen()"
        title="Archive students"
        (closed)="closeBulkModals()"
        [hasFooter]="true">
        <p>Archives {{ selectedIds().size }} student records.</p>
        <p>This removes students from active class rosters.</p>
        @if (bulkImpactLoading()) {
          <div class="state-block">
            <p>Loading impact preview…</p>
          </div>
        } @else if (bulkArchiveSubmitting()) {
          <div class="state-block">
            <p>Archiving students…</p>
          </div>
        } @else if (bulkImpactError()) {
          <div class="state-block error">
            <p>{{ bulkImpactError() }}</p>
            <mb-button size="sm" variant="tertiary" (click)="loadBulkArchiveImpact()">Retry</mb-button>
          </div>
        } @else if (bulkImpact()) {
          <div class="impact-summary">
            <p>Impact preview</p>
            <span>{{ bulkImpact()?.activeCount }} active enrollments</span>
            <span>{{ bulkImpact()?.linkedAccountsCount }} linked accounts</span>
          </div>
        }
        @if (requiresBulkConfirm()) {
          <label>
            Type ARCHIVE to confirm
            <mb-input [(ngModel)]="bulkConfirmText"></mb-input>
          </label>
        }
        <div mbModalFooter>
          <mb-button size="sm" variant="tertiary" (click)="closeBulkModals()">Cancel</mb-button>
          <mb-button
            size="sm"
            variant="danger"
            [disabled]="!canConfirmBulkArchive()"
            (click)="confirmBulkArchive()">
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
    private readonly toast: ToastService,
  ) {}

  loading = signal(true);
  error = signal<string | null>(null);
  students = signal<Student[]>([]);
  filterOptions = signal<StudentFilterResponse | null>(null);

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
  detailMenuOpen = signal(false);
  summaryMenuOpen = signal(false);
  guardianMenuOpen = signal<string | null>(null);
  guardianModalOpen = signal(false);
  guardianSubmitting = signal(false);
  guardianError = signal<string | null>(null);
  guardianDraft = {
    name: '',
    relationship: RelationshipType.FATHER,
    phone: '',
    email: '',
    isPrimary: true,
    isEmergencyContact: true,
    occupation: '',
  };
  academicsLoading = signal(false);
  academicsError = signal<string | null>(null);
  academicsSubjects = signal<StudentAcademicSubject[]>([]);
  academicsTerms = signal<StudentAcademicTerm[]>([]);
  feesLoading = signal(false);
  feesError = signal<string | null>(null);
  feesSummary = signal<StudentFeeSummary | null>(null);
  feesInvoices = signal<StudentFeeInvoice[]>([]);
  feesPayments = signal<StudentFeePayment[]>([]);
  notesLoading = signal(false);
  notesError = signal<string | null>(null);
  notes = signal<StudentNote[]>([]);
  guardiansLoading = signal(false);
  guardiansError = signal<string | null>(null);
  guardians = signal<Guardian[]>([]);
  documentsLoading = signal(false);
  documentsError = signal<string | null>(null);
  documents = signal<Document[]>([]);
  noteModalOpen = signal(false);
  noteSubmitting = signal(false);
  noteDraft = {
    title: '',
    content: '',
    visibility: 'internal' as 'internal' | 'staff',
  };
  documentModalOpen = signal(false);
  documentSubmitting = signal(false);
  documentError = signal<string | null>(null);
  documentDraft = {
    type: '',
    note: '',
  };
  documentFile: File | null = null;
  selectedDetailTab = signal<DetailTabKey>('overview');
  detailTabs: DetailTab[] = [
    { key: 'overview', label: 'Overview', moduleKey: MODULE_KEYS.STUDENTS, permission: PERMISSIONS.students.read },
    { key: 'guardians', label: 'Guardians', moduleKey: MODULE_KEYS.STUDENTS, permission: PERMISSIONS.students.read },
    { key: 'academics', label: 'Academics', moduleKey: MODULE_KEYS.ACADEMICS, permission: PERMISSIONS.academics.read },
    { key: 'fees', label: 'Fees', moduleKey: MODULE_KEYS.FEES, permission: PERMISSIONS.fees.read },
    { key: 'notes', label: 'Notes', moduleKey: MODULE_KEYS.STUDENTS, permission: PERMISSIONS.students.read },
    { key: 'documents', label: 'Documents', moduleKey: MODULE_KEYS.STUDENTS, permission: PERMISSIONS.students.read },
    { key: 'activity', label: 'Activity', moduleKey: MODULE_KEYS.STUDENTS, permission: PERMISSIONS.students.read },
  ];
  visibleDetailTabs = computed(() => this.detailTabs.filter((tab) => this.isDetailTabVisible(tab)));
  createModalOpen = signal(false);
  bulkArchiveOpen = signal(false);
  bulkImpactLoading = signal(false);
  bulkImpactError = signal<string | null>(null);
  bulkImpact = signal<{ total: number; activeCount: number; linkedAccountsCount: number } | null>(null);
  bulkArchiveSubmitting = signal(false);
  singleArchiveOpen = signal(false);
  singleArchiveLoading = signal(false);
  singleArchiveError = signal<string | null>(null);
  singleArchiveImpact = signal<{ total: number; activeCount: number; linkedAccountsCount: number } | null>(null);
  singleArchiveSubmitting = signal(false);
  singleArchiveConfirmText = '';
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
  private studentsSub?: Subscription;
  private filtersSub?: Subscription;
  private activitySub?: Subscription;
  private detailSub?: Subscription;
  private guardiansSub?: Subscription;
  private notesSub?: Subscription;
  private documentsSub?: Subscription;
  private academicsSub?: Subscription;
  private feesSub?: Subscription;

  skeletonRows = Array.from({ length: 8 });

  pageSizeOptions: MbSelectOption[] = [
    { label: '25 / page', value: '25' },
    { label: '50 / page', value: '50' },
    { label: '100 / page', value: '100' },
  ];

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

  guardianRelationshipOptions: MbSelectOption[] = [
    { label: 'Father', value: RelationshipType.FATHER },
    { label: 'Mother', value: RelationshipType.MOTHER },
    { label: 'Guardian', value: RelationshipType.GUARDIAN },
    { label: 'Sibling', value: RelationshipType.SIBLING },
    { label: 'Grandparent', value: RelationshipType.GRANDPARENT },
    { label: 'Other', value: RelationshipType.OTHER },
  ];

  noteVisibilityOptions: MbSelectOption[] = [
    { label: 'Internal', value: 'internal' },
    { label: 'Staff only', value: 'staff' },
  ];

  documentTypeOptions: MbSelectOption[] = [];

  guardianColumns: MbTableColumn<Guardian>[] = [
    {
      key: 'name',
      label: 'Name',
      cell: (row) => ({
        primary: row.name,
        secondary: row.relationship ? this.titleCase(row.relationship) : undefined,
        badges: row.isPrimary ? [{ label: 'Primary', tone: 'success' }] : undefined,
      }),
    },
    {
      key: 'phone',
      label: 'Phone',
      cell: (row) => row.phone || '—',
    },
    {
      key: 'email',
      label: 'Email',
      cell: (row) => row.email || '—',
    },
    {
      key: 'emergency',
      label: 'Emergency',
      align: 'center',
      cell: (row) => (row.isEmergencyContact ? 'Yes' : '—'),
    },
  ];

  academicSubjectColumns: MbTableColumn<StudentAcademicSubject>[] = [
    {
      key: 'subject',
      label: 'Subject',
      cell: (row) => row.subject,
    },
    {
      key: 'teacher',
      label: 'Teacher',
      cell: (row) => row.teacher || '—',
    },
    {
      key: 'performance',
      label: 'Term performance',
      cell: (row) => row.performance || '—',
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      cell: (row) => row.status || '—',
    },
  ];

  academicTermColumns: MbTableColumn<StudentAcademicTerm>[] = [
    {
      key: 'year',
      label: 'Year',
      cell: (row) => row.year,
    },
    {
      key: 'term',
      label: 'Term',
      cell: (row) => row.term,
    },
    {
      key: 'average',
      label: 'Average/GPA',
      cell: (row) => row.average || '—',
    },
    {
      key: 'rank',
      label: 'Rank',
      align: 'center',
      cell: (row) => row.rank || '—',
    },
  ];

  feeInvoiceColumns: MbTableColumn<StudentFeeInvoice>[] = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'period', label: 'Period' },
    { key: 'amount', label: 'Amount' },
    { key: 'paid', label: 'Paid' },
    { key: 'balance', label: 'Balance' },
    { key: 'status', label: 'Status' },
    { key: 'dueDate', label: 'Due date' },
  ];

  feePaymentColumns: MbTableColumn<StudentFeePayment>[] = [
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'method', label: 'Method' },
    { key: 'reference', label: 'Reference' },
    { key: 'receivedBy', label: 'Received by' },
  ];

  documentColumns: MbTableColumn<Document>[] = [
    {
      key: 'type',
      label: 'Type',
      cell: (row) => row.type || '—',
    },
    {
      key: 'name',
      label: 'File',
      cell: (row) => row.name || '—',
    },
    {
      key: 'uploadedAt',
      label: 'Uploaded',
      cell: (row) => this.formatDate(row.uploadedAt),
    },
  ];

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
    const options = this.filterOptions()?.statuses || [];
    return [
      { label: 'All statuses', value: '' },
      ...options.map((status) => ({ label: this.titleCase(status.value), value: status.value })),
    ];
  });

  gradeOptions = computed<MbSelectOption[]>(() => {
    const options = this.filterOptions()?.grades || [];
    return [{ label: 'All grades', value: '' }, ...options.map((grade) => ({ label: grade.value, value: grade.value }))];
  });

  classOptions = computed<MbSelectOption[]>(() => {
    const options = this.filterOptions()?.sections || [];
    return [{ label: 'All sections', value: '' }, ...options.map((section) => ({ label: section.value, value: section.value }))];
  });

  yearOptions = computed<MbSelectOption[]>(() => {
    const options = this.filterOptions()?.years || [];
    return [{ label: 'All years', value: '' }, ...options.map((year) => ({ label: year.value, value: year.value }))];
  });

  bulkStatusOptions = computed<MbSelectOption[]>(() =>
    (this.filterOptions()?.statuses || []).map((status) => ({
      label: this.titleCase(status.value),
      value: status.value,
    })),
  );

  bulkClassOptions = computed<MbSelectOption[]>(() => {
    const values = this.filterOptions()?.sections || [];
    return values.map((section) => ({ label: section.value, value: section.value }));
  });

  attentionFiltersList = computed(() => {
    const students = this.students();
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

  private buildFilterParams(): StudentFilters {
    return {
      search: this.searchTerm() || undefined,
      status: this.statusFilter || undefined,
      class: this.gradeFilter || undefined,
      section: this.classFilter || undefined,
      academicYear: this.yearFilter || undefined,
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

  private resetGuardianDraft(): void {
    this.guardianDraft = {
      name: '',
      relationship: RelationshipType.FATHER,
      phone: '',
      email: '',
      isPrimary: true,
      isEmergencyContact: true,
      occupation: '',
    };
  }

  private resetNoteDraft(): void {
    this.noteDraft = {
      title: '',
      content: '',
      visibility: 'internal',
    };
  }

  private resetDocumentDraft(): void {
    this.documentDraft = {
      type: '',
      note: '',
    };
    this.documentFile = null;
  }

  private isAttentionFilter(value: string): value is AttentionFilter {
    return value === 'missing-docs' || value === 'missing-guardian' || value === 'inactive';
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
    this.detailMenuOpen.set(false);
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
      const tabParam = params.get('tab');
      const storedTab = this.loadStoredDetailTab();
      const nextTab = this.resolveDetailTab((tabParam || storedTab) as DetailTabKey | null);
      if (nextTab) {
        this.selectedDetailTab.set(nextTab);
      }
      this.loadStudents();
      this.loadActivity(true);
      this.loadFilterOptions();
    });
    this.loadColumnConfig();
  }

  loadStudents(): void {
    this.loading.set(true);
    this.error.set(null);
    this.studentsSub?.unsubscribe();
    this.studentsSub = this.studentsService.getStudents(this.buildStudentFilters()).subscribe({
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
    this.filtersSub?.unsubscribe();
    this.filtersSub = this.studentsService.getStudentFilters(this.buildFilterParams()).subscribe({
      next: (options) => {
        this.filterOptions.set(options);
      },
      error: () => {
        this.filterOptions.set(null);
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
    this.guardians.set([]);
    this.documents.set([]);
    this.notes.set([]);
    this.academicsSubjects.set([]);
    this.academicsTerms.set([]);
    this.feesSummary.set(null);
    this.feesInvoices.set([]);
    this.feesPayments.set([]);
    this.loadDetailTabData(this.selectedDetailTab());
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
    this.guardians.set([]);
    this.documents.set([]);
    this.notes.set([]);
    this.academicsSubjects.set([]);
    this.academicsTerms.set([]);
    this.feesSummary.set(null);
    this.feesInvoices.set([]);
    this.feesPayments.set([]);
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

  toggleDetailMenu(event: Event): void {
    event.stopPropagation();
    this.detailMenuOpen.set(!this.detailMenuOpen());
  }

  toggleSummaryMenu(event: Event): void {
    event.stopPropagation();
    this.summaryMenuOpen.set(!this.summaryMenuOpen());
  }

  toggleGuardianMenu(event: Event, id: string): void {
    event.stopPropagation();
    this.guardianMenuOpen.set(this.guardianMenuOpen() === id ? null : id);
  }

  openGuardianModal(): void {
    this.guardianError.set(null);
    this.resetGuardianDraft();
    this.guardianModalOpen.set(true);
  }

  closeGuardianModal(): void {
    this.guardianModalOpen.set(false);
    this.guardianSubmitting.set(false);
  }

  openNoteModal(): void {
    this.resetNoteDraft();
    this.notesError.set(null);
    this.noteModalOpen.set(true);
  }

  closeNoteModal(): void {
    this.noteModalOpen.set(false);
    this.noteSubmitting.set(false);
  }

  submitNote(): void {
    if (!this.noteDraft.content.trim()) {
      this.notesError.set('Note content is required.');
      return;
    }
    this.noteSubmitting.set(true);
    this.notesError.set(null);
    this.logAction('student_note_created');
    this.noteSubmitting.set(false);
    this.noteModalOpen.set(false);
  }

  openDocumentModal(): void {
    this.resetDocumentDraft();
    this.documentError.set(null);
    this.documentModalOpen.set(true);
  }

  closeDocumentModal(): void {
    this.documentModalOpen.set(false);
    this.documentSubmitting.set(false);
  }

  handleDocumentFile(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.documentFile = target.files?.[0] || null;
  }

  submitDocument(): void {
    if (!this.documentDraft.type) {
      this.documentError.set('Document type is required.');
      return;
    }
    if (!this.documentFile) {
      this.documentError.set('Please select a file to upload.');
      return;
    }
    this.documentSubmitting.set(true);
    this.documentError.set(null);
    this.logAction('student_document_uploaded');
    this.documentSubmitting.set(false);
    this.documentModalOpen.set(false);
  }

  submitGuardian(): void {
    if (!this.selectedStudentId()) {
      return;
    }
    if (!this.guardianDraft.name.trim() || !this.guardianDraft.phone.trim()) {
      this.guardianError.set('Name and phone are required.');
      return;
    }
    this.guardianSubmitting.set(true);
    this.guardianError.set(null);
    const payload = {
      name: this.guardianDraft.name.trim(),
      relationship: this.guardianDraft.relationship,
      phone: this.guardianDraft.phone.trim(),
      email: this.guardianDraft.email?.trim() || undefined,
      occupation: this.guardianDraft.occupation?.trim() || undefined,
      isPrimary: this.guardianDraft.isPrimary,
      isEmergencyContact: this.guardianDraft.isEmergencyContact,
    };
    this.studentsService.addGuardian(this.selectedStudentId()!, payload).subscribe({
      next: (student) => {
        this.selectedStudentDetail.set(student);
        this.students.set(
          this.students().map((existing) => (existing.id === student.id ? student : existing))
        );
        this.guardians.set(student.guardians || []);
        this.guardianSubmitting.set(false);
        this.guardianModalOpen.set(false);
      },
      error: () => {
        this.guardianError.set('Unable to add guardian.');
        this.guardianSubmitting.set(false);
      },
    });
  }

  setPrimaryGuardian(guardian: Guardian): void {
    this.guardianMenuOpen.set(null);
    this.logAction(`guardian_set_primary:${guardian.id}`);
  }

  inviteGuardian(guardian: Guardian): void {
    this.guardianMenuOpen.set(null);
    this.logAction(`guardian_invite:${guardian.id}`);
  }

  removeGuardian(guardian: Guardian): void {
    this.guardianMenuOpen.set(null);
    this.logAction(`guardian_remove:${guardian.id}`);
  }

  selectDetailTab(tab: DetailTabKey): void {
    if (this.selectedDetailTab() === tab) {
      return;
    }
    this.selectedDetailTab.set(tab);
    this.detailMenuOpen.set(false);
    this.persistDetailTab(tab);
    this.loadDetailTabData(tab);
    this.router.navigate([], {
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  editPanelStudent(): void {
    const student = this.panelStudent();
    if (!student) {
      return;
    }
    this.detailMenuOpen.set(false);
    this.router.navigate(['/students', student.id, 'edit']);
  }

  openTransferFromPanel(): void {
    const student = this.panelStudent();
    if (!student) {
      return;
    }
    this.detailMenuOpen.set(false);
    this.logAction('student_transfer_opened');
  }

  openChangeSectionFromPanel(): void {
    const student = this.panelStudent();
    if (!student) {
      return;
    }
    this.detailMenuOpen.set(false);
    this.logAction('student_change_section_opened');
  }

  archivePanelStudent(): void {
    const student = this.panelStudent();
    if (!student) {
      return;
    }
    this.detailMenuOpen.set(false);
    this.openSingleArchive(student.id);
  }

  isDetailTabVisible(tab: DetailTab): boolean {
    if (tab.moduleKey && !this.entitlements.isEnabled(tab.moduleKey)) {
      return false;
    }
    if (tab.permission && !this.rbac.can(tab.permission as any)) {
      return false;
    }
    return true;
  }

  formatDate(value?: Date | string | null): string {
    if (!value) {
      return '—';
    }
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString();
  }

  formatAddress(student: Student | null): string {
    if (!student?.address) {
      return '—';
    }
    const parts = [
      student.address.street,
      student.address.city,
      student.address.state,
      student.address.postalCode,
      student.address.country
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  }

  detailFlags(student: Student | null): Array<{ label: string; note: string; action: string; tab: DetailTabKey }> {
    if (!student) {
      return [];
    }
    const flags: Array<{ label: string; note: string; action: string; tab: DetailTabKey }> = [];
    if (this.hasMissingGuardian(student)) {
      flags.push({
        label: 'Missing guardian',
        note: 'Add a primary guardian to complete the profile.',
        action: 'Add guardian',
        tab: 'guardians'
      });
    }
    if (this.hasMissingDocs(student)) {
      flags.push({
        label: 'Missing documents',
        note: 'Upload required documents for verification.',
        action: 'Upload documents',
        tab: 'documents'
      });
    }
    if (student.status === StudentStatus.INACTIVE) {
      flags.push({
        label: 'Enrollment incomplete',
        note: 'Complete the enrollment workflow for activation.',
        action: 'Review enrollment',
        tab: 'overview'
      });
    }
    return flags;
  }

  headerFlagTags(student: Student | null): string[] {
    if (!student) {
      return [];
    }
    const tags: string[] = [];
    if (this.hasMissingDocs(student)) {
      tags.push('Missing docs');
    }
    if (this.hasMissingGuardian(student)) {
      tags.push('No guardian');
    }
    return tags;
  }

  private resolveDetailTab(tab: DetailTabKey | null): DetailTabKey | null {
    if (!tab) {
      return this.visibleDetailTabs()[0]?.key ?? 'overview';
    }
    const match = this.visibleDetailTabs().find((item) => item.key === tab);
    return match ? match.key : this.visibleDetailTabs()[0]?.key ?? 'overview';
  }

  private persistDetailTab(tab: DetailTabKey): void {
    try {
      localStorage.setItem(this.detailTabStorageKey(), tab);
    } catch {
      // Ignore storage errors.
    }
  }

  private loadStoredDetailTab(): DetailTabKey | null {
    try {
      const value = localStorage.getItem(this.detailTabStorageKey());
      return (value as DetailTabKey) || null;
    } catch {
      return null;
    }
  }

  private detailTabStorageKey(): string {
    const tenantId = this.tenantContext.activeTenantId() || 'tenant';
    const userId = this.rbac.getSession()?.userId || 'user';
    return `students.detail.tab.${tenantId}.${userId}`;
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
    this.detailSub?.unsubscribe();
    this.detailSub = this.studentsService.getStudent(id).subscribe({
      next: (student) => {
        this.selectedStudentDetail.set(student);
        this.detailLoading.set(false);
        this.loadDetailTabData(this.selectedDetailTab());
      },
      error: () => {
        this.selectedStudentDetail.set(null);
        this.detailLoading.set(false);
      }
    });
  }

  loadDetailTabData(tab: DetailTabKey): void {
    const studentId = this.selectedStudentId();
    if (!studentId) {
      return;
    }
    if (tab === 'guardians') {
      this.guardiansLoading.set(true);
      this.guardiansError.set(null);
      this.guardiansSub?.unsubscribe();
      this.guardiansSub = this.studentsService.getStudentGuardians(studentId).subscribe({
        next: (items) => {
          this.guardians.set(items);
          this.guardiansLoading.set(false);
        },
        error: () => {
          this.guardiansError.set('Unable to load guardians.');
          this.guardiansLoading.set(false);
        },
      });
      return;
    }
    if (tab === 'documents') {
      this.documentsLoading.set(true);
      this.documentsError.set(null);
      this.documentsSub?.unsubscribe();
      this.documentsSub = this.studentsService.getStudentDocuments(studentId).subscribe({
        next: (items) => {
          this.documents.set(items);
          this.documentsLoading.set(false);
        },
        error: () => {
          this.documentsError.set('Unable to load documents.');
          this.documentsLoading.set(false);
        },
      });
      return;
    }
    if (tab === 'notes') {
      this.notesLoading.set(true);
      this.notesError.set(null);
      this.notesSub?.unsubscribe();
      this.notesSub = this.studentsService.getStudentNotes(studentId).subscribe({
        next: (items) => {
          this.notes.set(items);
          this.notesLoading.set(false);
        },
        error: () => {
          this.notesError.set('Unable to load notes.');
          this.notesLoading.set(false);
        },
      });
      return;
    }
    if (tab === 'academics') {
      this.academicsLoading.set(true);
      this.academicsError.set(null);
      this.academicsSub?.unsubscribe();
      this.academicsSub = this.studentsService.getStudentAcademics(studentId).subscribe({
        next: (data) => {
          this.academicsSubjects.set(data.subjects || []);
          this.academicsTerms.set(data.terms || []);
          this.academicsLoading.set(false);
        },
        error: () => {
          this.academicsError.set('Unable to load academics.');
          this.academicsLoading.set(false);
        },
      });
      return;
    }
    if (tab === 'fees') {
      this.feesLoading.set(true);
      this.feesError.set(null);
      this.feesSub?.unsubscribe();
      this.feesSub = this.studentsService.getStudentFees(studentId).subscribe({
        next: (data) => {
          this.feesSummary.set(data.summary || null);
          this.feesInvoices.set(data.invoices || []);
          this.feesPayments.set(data.payments || []);
          this.feesLoading.set(false);
        },
        error: () => {
          this.feesError.set('Unable to load fees.');
          this.feesLoading.set(false);
        },
      });
      return;
    }
    if (tab === 'activity') {
      this.loadActivity(true);
    }
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
    this.activitySub?.unsubscribe();
    this.activitySub = this.studentsService
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
    this.bulkImpact.set(null);
    this.bulkImpactError.set(null);
    this.bulkImpactLoading.set(false);
    this.bulkArchiveSubmitting.set(false);
    this.bulkArchiveOpen.set(true);
    this.loadBulkArchiveImpact();
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

  formatUpdated(date?: Date | string): string {
    if (!date) {
      return '—';
    }
    const value = typeof date === 'string' ? new Date(date) : date;
    return value.toLocaleDateString();
  }

  formatRelativeUpdated(date?: Date | string): string {
    if (!date) {
      return '—';
    }
    const value = typeof date === 'string' ? new Date(date) : date;
    const diffMs = Date.now() - value.getTime();
    if (Number.isNaN(diffMs)) return '—';
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diffMs < minute) return 'just now';
    if (diffMs < hour) return `${Math.floor(diffMs / minute)} min ago`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)} h ago`;
    if (diffMs < day * 30) return `${Math.floor(diffMs / day)} days ago`;
    return value.toLocaleDateString();
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
    const guardian = this.getPrimaryGuardian(student);
    return guardian?.name || '—';
  }

  primaryGuardianPhone(student?: Student | null): string {
    const guardian = this.getPrimaryGuardian(student);
    return guardian?.phone || '—';
  }

  primaryGuardianEmail(student?: Student | null): string {
    const guardian = this.getPrimaryGuardian(student);
    return guardian?.email || '—';
  }

  getPrimaryGuardian(student?: Student | null): Guardian | null {
    if (!student) return null;
    return student.primaryGuardian
      || student.guardians?.find((guardian) => guardian.isPrimary)
      || student.guardians?.[0]
      || null;
  }

  copyToClipboard(value?: string | null): void {
    if (!value || !navigator?.clipboard) return;
    navigator.clipboard.writeText(value).then(() => {
      this.toast.info('Copied to clipboard', 1500);
    }).catch(() => {});
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
    if (event.key === 'Enter' && this.selectedStudent()) {
      this.openDetailDrawer();
    }
  }


  closeBulkModals(): void {
    this.bulkArchiveOpen.set(false);
    this.bulkStatusOpen.set(false);
    this.bulkAssignOpen.set(false);
    this.bulkImpact.set(null);
    this.bulkImpactError.set(null);
    this.bulkImpactLoading.set(false);
    this.bulkArchiveSubmitting.set(false);
  }

  confirmBulkArchive(): void {
    if (!this.canConfirmBulkArchive()) {
      return;
    }
    const ids = Array.from(this.selectedIds());
    this.bulkImpactError.set(null);
    this.bulkArchiveSubmitting.set(true);
    this.studentsService.bulkArchive(ids).subscribe({
      next: () => {
        this.bulkArchiveSubmitting.set(false);
        this.closeBulkModals();
        this.selectedIds.set(new Set());
        this.resetTableSelection();
        this.loadStudents();
        this.logAction('students_bulk_archived');
      },
      error: () => {
        this.bulkArchiveSubmitting.set(false);
        this.bulkImpactError.set('Unable to archive students.');
      }
    });
  }

  confirmBulkStatus(): void {
    this.closeBulkModals();
    this.logAction('students_bulk_status_updated');
  }

  confirmBulkAssign(): void {
    this.closeBulkModals();
    this.logAction('students_bulk_assigned');
  }

  loadBulkArchiveImpact(): void {
    const ids = Array.from(this.selectedIds());
    if (!ids.length) {
      this.bulkImpact.set(null);
      this.bulkImpactLoading.set(false);
      return;
    }
    this.bulkImpactLoading.set(true);
    this.bulkImpactError.set(null);
    this.studentsService.previewArchive(ids).subscribe({
      next: (impact) => {
        this.bulkImpact.set(impact);
        this.bulkImpactLoading.set(false);
      },
      error: () => {
        this.bulkImpactError.set('Unable to load impact preview.');
        this.bulkImpactLoading.set(false);
      }
    });
  }

  requiresBulkConfirm(): boolean {
    const impact = this.bulkImpact();
    if (!impact) {
      return false;
    }
    return impact.activeCount > 0 || impact.linkedAccountsCount > 0;
  }

  canConfirmBulkArchive(): boolean {
    if (this.bulkImpactLoading() || this.bulkArchiveSubmitting()) {
      return false;
    }
    if (this.bulkImpactError()) {
      return false;
    }
    if (this.requiresBulkConfirm()) {
      return this.bulkConfirmText === 'ARCHIVE';
    }
    return true;
  }

  openSingleArchive(studentId: string): void {
    this.singleArchiveConfirmText = '';
    this.singleArchiveImpact.set(null);
    this.singleArchiveError.set(null);
    this.singleArchiveLoading.set(true);
    this.singleArchiveSubmitting.set(false);
    this.singleArchiveOpen.set(true);
    this.studentsService.previewArchive([studentId]).subscribe({
      next: (impact) => {
        this.singleArchiveImpact.set(impact);
        this.singleArchiveLoading.set(false);
      },
      error: () => {
        this.singleArchiveError.set('Unable to load impact preview.');
        this.singleArchiveLoading.set(false);
      },
    });
  }

  closeSingleArchive(): void {
    this.singleArchiveOpen.set(false);
    this.singleArchiveSubmitting.set(false);
  }

  requiresSingleArchiveConfirm(): boolean {
    const impact = this.singleArchiveImpact();
    if (!impact) return false;
    return impact.activeCount > 0 || impact.linkedAccountsCount > 0;
  }

  canConfirmSingleArchive(): boolean {
    if (this.singleArchiveLoading() || this.singleArchiveSubmitting()) {
      return false;
    }
    if (this.singleArchiveError()) {
      return false;
    }
    if (this.requiresSingleArchiveConfirm()) {
      return this.singleArchiveConfirmText === 'ARCHIVE';
    }
    return true;
  }

  confirmSingleArchive(): void {
    const studentId = this.selectedStudentId();
    if (!studentId || !this.canConfirmSingleArchive()) {
      return;
    }
    this.singleArchiveSubmitting.set(true);
    this.studentsService.bulkArchive([studentId]).subscribe({
      next: () => {
        this.singleArchiveSubmitting.set(false);
        this.singleArchiveOpen.set(false);
        this.logAction('student_archived');
        this.loadStudents();
      },
      error: () => {
        this.singleArchiveError.set('Unable to archive student.');
        this.singleArchiveSubmitting.set(false);
      },
    });
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
  guardianRowKey = (guardian: Guardian) => guardian.id;

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
