import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { HostApi } from '../../../core/api/host-api';
import { TenantListItem } from '../../../core/api/models';

import { TenantsStore } from './tenants.store';
import { TenantFormDialogComponent } from './tenant-form.dialog';

// UI kit (from Task 1.2)
import { PageHeaderComponent } from '../../../core/ui/page-header/page-header.component';
import { UiButtonComponent } from '../../../shared/ui/buttons/ui-button.component';
import { UiInputComponent } from '../../../shared/ui/forms/ui-input.component';
import { UiSelectComponent } from '../../../shared/ui/forms/ui-select.component';
import { ToolbarComponent } from '../../../core/ui/toolbar/toolbar.component';
import { DataTableShellComponent } from '../../../core/ui/data-table-shell/data-table-shell.component';
import { SimpleTableComponent, SimpleColumn } from '../../../core/ui/simple-table/simple-table.component';

import { ConfirmService } from '../../../core/ui/confirm/confirm.service';
import { ToastService } from '../../../core/ui/toast/toast.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TenantBootstrapService } from '../../../core/tenant/tenant-bootstrap.service';
import { AuthSession, TenantMembership } from '../../../core/auth/auth.models';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    RouterLink,

    PageHeaderComponent,
    ToolbarComponent,
    DataTableShellComponent,
    SimpleTableComponent,

    // Shared UI primitives
    UiButtonComponent,
    UiInputComponent,
    UiSelectComponent,

    TenantFormDialogComponent,
  ],
  template: `
    <host-page-header
      title="Tenants"
      description="Manage schools (tenants) across the entire platform."
    >
      <ui-button variant="primary" (click)="openCreate()">Create Tenant</ui-button>
    </host-page-header>

    <host-toolbar>
      <ui-input
        [value]="store.q()"
        (valueChange)="setQ($event)"
        placeholder="Search by name or subdomain…"
      ></ui-input>

      <ui-select [value]="store.status()" (valueChange)="setStatus($event)">
        <option value="ALL">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="SUSPENDED">Suspended</option>
        <option value="TRIAL">Trial</option>
      </ui-select>

      <ui-select [value]="store.editionId()" (valueChange)="setEditionId($event)">
        <option value="ALL">All editions</option>
        <ng-container *ngFor="let e of store.editions()"> 
          <option [value]="e.id">{{ e.name }}</option>
        </ng-container>
      </ui-select>

      <ng-container actions>
        <button class="btn" (click)="reload()">Refresh</button>
      </ng-container>
    </host-toolbar>

    <host-data-table-shell
      [loading]="store.loading()"
      [error]="store.error() ?? undefined"
      [hasData]="store.hasData()"
      emptyText="No tenants found for the current filters."
    >
      <div class="card">
        <host-simple-table
          [columns]="tenantColumns"
          [data]="store.items()"
          [idKey]="'id'"
          (rowClick)="onTenantRowClick($event)"
          (view)="openEdit($event)"
        >
          <ng-template #actionTemplate let-row="row">
            <ui-button size="sm" (click)="$event.stopPropagation(); openEdit(row)">Edit</ui-button>
            <ui-button *ngIf="row.status !== 'SUSPENDED'" size="sm" variant="danger" (click)="$event.stopPropagation(); suspend(row)">Suspend</ui-button>
            <ui-button *ngIf="row.status === 'SUSPENDED'" size="sm" (click)="$event.stopPropagation(); activate(row)">Activate</ui-button>
            <ui-button size="sm" variant="ghost" [disabled]="impersonating" (click)="$event.stopPropagation(); impersonateTenant(row)">Impersonate</ui-button>
          </ng-template>
        </host-simple-table>

        <div class="pager">
          <div class="muted">
            Showing {{ rangeLabel() }} of {{ store.total() }}
          </div>

          <div class="pager-actions">
            <ui-button size="sm" [disabled]="store.page() <= 1" (click)="prevPage()">Prev</ui-button>
            <span class="page">{{ store.page() }}</span>
            <ui-button size="sm" [disabled]="isLastPage()" (click)="nextPage()">Next</ui-button>

            <ui-select [value]="store.pageSize()" (valueChange)="setPageSize($event)">
              <option [value]="10">10</option>
              <option [value]="20">20</option>
              <option [value]="50">50</option>
            </ui-select>
          </div>
        </div>
      </div>
    </host-data-table-shell>

    <tenant-form-dialog
      #tenantDialog
      [editions]="store.editions()"
      (create)="handleCreate($event)"
      (update)="handleUpdate($event.id, $event.input)"
    />
  `,
  styles: [`
    /* Card & layout */
    .card {
      border: 1px solid var(--host-border-subtle);
      border-radius: 14px;
      overflow: hidden;
      background: var(--host-surface-elevated);
      box-shadow: var(--host-shadow, 0 10px 30px rgba(2,6,23,0.06));
      font-family: var(--host-font-family);
      color: var(--host-text-color);
    }

    /* Table */
    .table { width: 100%; border-collapse: collapse; font-size: var(--host-font-size); line-height: 1.45; color: var(--host-text-color); }
    th, td { padding: 14px 12px; border-bottom: 1px solid var(--host-border-subtle); text-align: left; vertical-align: top; }
    th { font-size: 12px; color: var(--host-heading-color); text-transform: uppercase; letter-spacing: .06em; font-weight: 700; background: color-mix(in srgb, var(--host-surface-elevated, #fff) 96%, transparent 4%); }
    td { color: var(--host-text-color); font-size: var(--host-font-size); }

    .right { text-align: right; }

    .name { font-weight: 700; font-size: 16px; color: var(--host-text-color); }
    .muted { color: var(--host-muted-color); font-size: var(--host-small-font-size); margin-top: 4px; }

    /* Row hover for readability */
    tbody tr:hover { background: var(--host-surface-muted); }

    /* Status pills */
    .pill {
      display: inline-flex;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      border: 1px solid color-mix(in srgb, var(--host-border-subtle, rgba(0,0,0,0.06)) 80%, transparent 20%);
      background: color-mix(in srgb, var(--host-surface-muted, #f8fafc) 86%, transparent 14%);
      color: var(--host-text-color);
      font-weight: 700;
      box-shadow: none;
    }
    .pill.suspended {
      border-color: color-mix(in srgb, var(--color-error, #ef4444) 40%, transparent 60%);
      background: color-mix(in srgb, var(--color-error, #ef4444) 8%, var(--host-surface-elevated) 92%);
      color: var(--color-error, #ef4444);
    }
    .pill.trial {
      border-color: color-mix(in srgb, var(--host-accent, #54D6E8) 40%, transparent 60%);
      background: color-mix(in srgb, var(--host-accent, #54D6E8) 8%, var(--host-surface-elevated) 92%);
      color: var(--host-accent, #54D6E8);
    }

    /* Buttons */
    .btn {
      border: 1px solid var(--host-border-subtle);
      background: transparent;
      padding: 10px 12px;
      border-radius: 10px;
      cursor: pointer;
      color: var(--host-text-color);
    }
    .btn.primary {
      background: linear-gradient(180deg, var(--btn-primary-bg, var(--color-primary)) 0%, color-mix(in srgb, var(--btn-primary-bg, var(--color-primary)) 85%, #000 15%) 100%);
      color: var(--btn-primary-text, #fff);
      border-color: var(--btn-primary-border, var(--color-primary));
      box-shadow: var(--host-primary-glow, none);
    }
    .btn.small { padding: 7px 10px; border-radius: 10px; font-size: 13px; }
    .btn.danger {
      border-color: var(--color-error, #ef4444);
      color: var(--color-error, #ef4444);
      background: color-mix(in srgb, var(--color-error, #ef4444) 8%, transparent 92%);
      box-shadow: none;
    }
    .btn:disabled { opacity: .55; cursor: not-allowed; }

    /* Inputs */
    .input {
      border: 1px solid var(--host-border-subtle);
      border-radius: 10px;
      padding: 10px;
      outline: none;
      min-width: 220px;
      color: var(--host-text-color);
      background: var(--host-surface-elevated);
    }
    .input.small { min-width: unset; padding: 7px 10px; }

    /* Pager */
    .pager {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
    }
    .pager-actions { display: flex; gap: 8px; align-items: center; }
    .page { padding: 0 6px; color: var(--host-text-color); font-weight: 600; }
  `]
})
export class TenantsPage {
  private api = inject(HostApi);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private tenantBootstrap = inject(TenantBootstrapService);

  store = inject(TenantsStore);
  private router = inject(Router);

  impersonating = false;

  @ViewChild('tenantDialog') tenantDialog!: TenantFormDialogComponent;

  // Columns for shared table
  tenantColumns: SimpleColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'subdomain', label: 'Subdomain' },
    { key: 'editionName', label: 'Edition' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
  ];

  trackById(_: number, t: any) { return t.id; }

  onTenantRowClick(row: any) { this.router.navigate(['/host/tenants', row.id]); }

  async ngOnInit() {
    await this.loadEditionsLookupSafe();
    await this.reload();
  }

  async loadEditionsLookupSafe() {
    // Optional endpoint; ignore failure
    try {
      const editions = await firstValueFrom(this.api.listEditionsLookup());
      this.store.editions.set(editions);
    } catch {
      this.store.editions.set([]);
    }
  }

  async reload() {
    this.store.loading.set(true);
    this.store.error.set(null);

    try {
      const result = await firstValueFrom(this.api.listTenants(this.store.buildQuery()));
      this.store.setItems(result.items, result.total);
    } catch (e: any) {
      this.store.error.set(e?.message ?? 'Failed to load tenants');
      this.store.setItems([], 0);
      this.toast.error('Failed to load tenants');
    } finally {
      this.store.loading.set(false);
    }
  }

  onFilterChanged() {
    // When filters change, reset page and reload
    this.store.resetToFirstPage();
    void this.reload();
  }

  onPageSizeChanged() {
    this.store.resetToFirstPage();
    void this.reload();
  }

  prevPage() {
    this.store.page.set(this.store.page() - 1);
    void this.reload();
  }

  nextPage() {
    this.store.page.set(this.store.page() + 1);
    void this.reload();
  }

  isLastPage(): boolean {
    const total = this.store.total();
    const page = this.store.page();
    const pageSize = this.store.pageSize();
    return page * pageSize >= total;
  }

  rangeLabel(): string {
    const total = this.store.total();
    if (total === 0) return '0–0';

    const page = this.store.page();
    const pageSize = this.store.pageSize();
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `${start}–${end}`;
  }

  openCreate() {
    this.tenantDialog.showCreate();
  }

  openEdit(t: TenantListItem) {
    this.tenantDialog.showEdit(t);
  }

  // Bindings from template for signal updates
  setQ(value: string) {
    this.store.q.set(value);
    this.onFilterChanged();
  }

  setStatus(value: any) {
    this.store.status.set(value);
    this.onFilterChanged();
  }

  setEditionId(value: any) {
    this.store.editionId.set(value);
    this.onFilterChanged();
  }

  setPageSize(value: any) {
    // UiSelect emits string values via native select; coerce to number when appropriate
    const numeric = typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value;
    this.store.pageSize.set(numeric);
    this.onPageSizeChanged();
  }

  async impersonateTenant(row: TenantListItem) {
    if (this.impersonating) return;
    const ok = await this.confirm.confirm(`Impersonate "${row.name}"? You will switch into this tenant as an admin.`);
    if (!ok) return;

    this.impersonating = true;
    try {
      const response = await firstValueFrom(this.api.impersonateTenant(row.id, 'Host console tenant impersonation'));
      const session = this.auth.applyLoginResponse(response as any);
      await this.applyTenantSession(session);
      await this.router.navigate(['/dashboard']);
      this.toast.success(`Now impersonating ${row.name}`);
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Failed to start impersonation');
    } finally {
      this.impersonating = false;
    }
  }

  private async applyTenantSession(session: AuthSession) {
    const memberships = session.memberships || [];
    const targetTenantId = session.activeTenantId || memberships[0]?.tenantId;
    const target = memberships.find(m => m.tenantId === targetTenantId) || memberships[0];

    if (target) {
      await firstValueFrom(this.tenantBootstrap.switchTenant(target as TenantMembership));
    }
  }
  async handleCreate(input: any) {
    try {
      await firstValueFrom(this.api.createTenant(input));
      this.toast.success('Tenant created');
      await this.reload();
      this.tenantDialog.close();
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Failed to create tenant');
    }
  }

  async handleUpdate(id: string, input: any) {
    try {
      await firstValueFrom(this.api.updateTenant(id, input));
      this.toast.success('Tenant updated');
      await this.reload();
      this.tenantDialog.close();
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Failed to update tenant');
    }
  }

  async suspend(t: TenantListItem) {
    const ok = await this.confirm.confirm(`Suspend "${t.name}"? Users may be unable to access the tenant.`);
    if (!ok) return;

    try {
      await firstValueFrom(this.api.suspendTenant(t.id, `Suspended by host UI`));
      this.toast.success('Tenant suspended');
      await this.reload();
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Failed to suspend tenant');
    }
  }

  async activate(t: TenantListItem) {
    const ok = await this.confirm.confirm(`Activate "${t.name}"?`);
    if (!ok) return;

    try {
      await firstValueFrom(this.api.activateTenant(t.id));
      this.toast.success('Tenant activated');
      await this.reload();
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Failed to activate tenant');
    }
  }
}
