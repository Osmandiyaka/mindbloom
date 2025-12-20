import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { HostApi } from '../../../core/api/host-api';
import { TenantListItem } from '../../../core/api/models';

import { TenantsStore } from './tenants.store';
import { TenantFormDialogComponent } from './tenant-form.dialog';

// UI kit (from Task 1.2)
import { PageHeaderComponent } from '../../../core/ui/page-header/page-header.component';
import { ToolbarComponent } from '../../../core/ui/toolbar/toolbar.component';
import { DataTableShellComponent } from '../../../core/ui/data-table-shell/data-table-shell.component';

import { ConfirmService } from '../../../core/ui/confirm/confirm.service';
import { ToastService } from '../../../core/ui/toast/toast.service';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DatePipe,

        PageHeaderComponent,
        ToolbarComponent,
        DataTableShellComponent,

        TenantFormDialogComponent,
    ],
    template: `
    <host-page-header
      title="Tenants"
      description="Manage schools (tenants) across the entire platform."
    >
      <button class="btn primary" (click)="openCreate()">Create Tenant</button>
    </host-page-header>

    <host-toolbar>
      <input
        class="input"
        type="text"
        placeholder="Search by name or subdomain…"
        [ngModel]="store.q()"
        (ngModelChange)="setQ($event)"
      />

      <select class="input" [ngModel]="store.status()" (ngModelChange)="setStatus($event)">
        <option value="ALL">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="SUSPENDED">Suspended</option>
        <option value="TRIAL">Trial</option>
      </select>

      <select class="input" [ngModel]="store.editionId()" (ngModelChange)="setEditionId($event)">
        <option value="ALL">All editions</option>
        <ng-container *ngFor="let e of store.editions()"> 
          <option [value]="e.id">{{ e.name }}</option>
        </ng-container>
      </select>

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
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Subdomain</th>
              <th>Edition</th>
              <th>Status</th>
              <th>Created</th>
              <th class="right">Actions</th>
            </tr>
          </thead>

          <tbody>
            <ng-container *ngFor="let t of store.items(); trackBy: trackById">
              <tr>
                <td>
                  <div class="name">{{ t.name }}</div>
                  <div class="muted">ID: {{ t.id }}</div>
                </td>
                <td>{{ t.subdomain }}</td>
                <td>{{ t.editionName ?? '—' }}</td>
                <td>
                  <span class="pill" [class.suspended]="t.status==='SUSPENDED'" [class.trial]="t.status==='TRIAL'">
                    {{ t.status }}
                  </span>
                </td>
                <td>{{ t.createdAt | date:'mediumDate' }}</td>

                <td class="right">
                  <button class="btn small" (click)="openEdit(t)">Edit</button>

                  <button *ngIf="t.status !== 'SUSPENDED'" class="btn small danger" (click)="suspend(t)">Suspend</button>
                  <button *ngIf="t.status === 'SUSPENDED'" class="btn small" (click)="activate(t)">Activate</button>

                  <button class="btn small" disabled title="Coming soon">Impersonate</button>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>

        <div class="pager">
          <div class="muted">
            Showing {{ rangeLabel() }} of {{ store.total() }}
          </div>

          <div class="pager-actions">
            <button class="btn small" [disabled]="store.page() <= 1" (click)="prevPage()">Prev</button>
            <span class="page">{{ store.page() }}</span>
            <button class="btn small" [disabled]="isLastPage()" (click)="nextPage()">Next</button>

            <select class="input small" [ngModel]="store.pageSize()" (ngModelChange)="setPageSize($event)">
              <option [ngValue]="10">10</option>
              <option [ngValue]="20">20</option>
              <option [ngValue]="50">50</option>
            </select>
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
      box-shadow: 0 10px 30px rgba(2,6,23,0.06);
      font-family: var(--host-font-family);
      color: var(--host-text-color);
    }

    /* Table */
    .table { width: 100%; border-collapse: collapse; font-size: var(--host-font-size); line-height: 1.45; color: var(--host-text-color); }
    th, td { padding: 14px 12px; border-bottom: 1px solid var(--host-border-subtle); text-align: left; vertical-align: top; }
    th { font-size: 12px; color: var(--host-heading-color); text-transform: uppercase; letter-spacing: .06em; font-weight: 700; background: rgba(15,23,42,0.02); }
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
      border: 1px solid rgba(15,23,42,0.06);
      background: var(--host-surface-muted);
      color: var(--host-text-color);
      font-weight: 700;
    }
    .pill.suspended { border-color: #fca5a5; background: #fff1f2; color: #7f1d1d; }
    .pill.trial { border-color: #3b82f6; background: #eff6ff; color: #1e3a8a; }

    /* Buttons */
    .btn {
      border: 1px solid var(--host-border-subtle);
      background: transparent;
      padding: 10px 12px;
      border-radius: 10px;
      cursor: pointer;
      color: var(--host-text-color);
    }
    .btn.primary { background: #0b1220; color: #fff; border-color: #0b1220; }
    .btn.small { padding: 7px 10px; border-radius: 10px; font-size: 13px; }
    .btn.danger { border-color: #fca5a5; color: #7f1d1d; background: transparent; }
    .btn:disabled { opacity: .55; cursor: not-allowed; }

    /* Inputs */
    .input {
      border: 1px solid var(--host-border-subtle);
      border-radius: 10px;
      padding: 10px;
      outline: none;
      min-width: 220px;
      color: var(--host-text-color);
      background: #fff;
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

    store = inject(TenantsStore);

    @ViewChild('tenantDialog') tenantDialog!: TenantFormDialogComponent;

    trackById(_: number, t: any) { return t.id; }

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

    setPageSize(value: number) {
        this.store.pageSize.set(value);
        this.onPageSizeChanged();
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
