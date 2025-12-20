import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { HostApi } from '../../../core/api/host-api';
import { TenantActivityItem, TenantDetails, TenantMetrics, AuditEvent, PagedResult } from '../../../core/api/models';

import { PageHeaderComponent } from '../../../core/ui/page-header/page-header.component';
import { DataTableShellComponent } from '../../../core/ui/data-table-shell/data-table-shell.component';
import { SimpleTableComponent, SimpleColumn } from '../../../core/ui/simple-table/simple-table.component';

import { ConfirmService } from '../../../core/ui/confirm/confirm.service';
import { ToastService } from '../../../core/ui/toast/toast.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    PageHeaderComponent,
    DataTableShellComponent,
    SimpleTableComponent,
    // required for ngModel in selects
    FormsModule,
  ],
  template: `
    <div class="crumbs">
      <a routerLink="/host/tenants">← Back to Tenants</a>
    </div>

    <host-page-header
      [title]="tenantTitle()"
      [description]="tenantSubtitle()"
      [titleLink]="publicUrl()"
    >
      <button class="btn" (click)="reload()">Refresh</button>
      <button class="btn" (click)="openEdit()" [disabled]="loading()">Edit</button>

      @if (tenant()?.status !== 'SUSPENDED') {
        <button class="btn danger" (click)="suspend()" [disabled]="loading()">Suspend</button>
      } @else {
        <button class="btn" (click)="activate()" [disabled]="loading()">Activate</button>
      }

      <button class="btn" disabled title="Coming soon">Impersonate</button>
    </host-page-header>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" [class.active]="currentTab() === 'overview'" (click)="setTab('overview')">Overview</button>
      <button class="tab" [class.active]="currentTab() === 'audit'" (click)="setTab('audit')">Audit Logs</button>
      <button class="tab" [class.active]="currentTab() === 'users'" (click)="setTab('users')">Tenant Users</button>
      <button class="tab" [class.active]="currentTab() === 'invoices'" (click)="setTab('invoices')">Invoices</button>
      <button class="tab" [class.active]="currentTab() === 'issues'" (click)="setTab('issues')">Issues</button>
    </div>

    <host-data-table-shell
      [loading]="loading()"
      [error]="error() ?? undefined"
      [hasData]="!!tenant()"
      emptyText="Tenant not found."
    >

      <!-- Overview Tab -->
      @if (currentTab() === 'overview') {
        <div class="overview">
          <!-- Summary row -->
          <div class="summary">
            <div class="summary-card">
              <div class="label"><span class="icon">⚑</span> Status</div>
              <div class="value">
                <span class="pill"
                      [class.suspended]="tenant()?.status==='SUSPENDED'"
                      [class.trial]="tenant()?.status==='TRIAL'">
                  {{ tenant()?.status }}
                </span>
              </div>
            </div>

            <div class="summary-card">
              <div class="label"><span class="icon">🌐</span> Subdomain</div>
              <div class="value">{{ tenant()?.subdomain }}</div>
              <div class="muted">https://{{ tenant()?.subdomain }}.yourapp.com</div>
            </div>

            <div class="summary-card">
              <div class="label"><span class="icon">📦</span> Edition</div>
              <div class="value">{{ tenant()?.editionName ?? '—' }}</div>
              <div class="muted" *ngIf="tenant()?.subscriptionEndDate">Subscription ends: {{ tenant()?.subscriptionEndDate | date:'medium' }}</div>
            </div>

            <div class="summary-card">
              <div class="label"><span class="icon">📅</span> Created</div>
              <div class="value">{{ tenant()?.createdAt | date:'mediumDate' }}</div>
            </div>
          </div>

          <!-- Metrics cards -->
          <div class="section-title">Metrics</div>
          <div class="metrics">
            <div class="metric">
              <div class="label"><span class="icon">👩‍🎓</span> Students</div>
              <div class="value">{{ metrics()?.studentsCount ?? '—' }}</div>
            </div>

            <div class="metric">
              <div class="label"><span class="icon">🧑‍🏫</span> Teachers</div>
              <div class="value">{{ metrics()?.teachersCount ?? '—' }}</div>
            </div>

            <div class="metric">
              <div class="label"><span class="icon">👥</span> Users</div>
              <div class="value">{{ metrics()?.usersCount ?? '—' }}</div>
            </div>

            <div class="metric">
              <div class="label"><span class="icon">💾</span> Storage</div>
              <div class="value">{{ storageLabel() }}</div>
              <div class="muted" *ngIf="metrics()?.storageLimitMb">
                Limit: {{ metrics()?.storageLimitMb }} MB
              </div>
            </div>

            <div class="metric" *ngIf="metrics()?.mrr !== undefined">
              <div class="label">MRR</div>
              <div class="value">{{ mrrLabel() }}</div>
            </div>
          </div>

          <!-- Activity -->
          <div class="section-title">Last activity</div>
          <div class="card">
            @if (!activity().length) {
              <div class="empty">No recent activity.</div>
            } @else {
              <ul class="activity">
                @for (a of activity(); track a.id) {
                  <li class="row">
                    <div class="left">
                      <div class="msg">{{ a.message }}</div>
                      <div class="meta">
                        <span class="type">{{ a.type }}</span>
                        <span class="dot">•</span>
                        <span>{{ a.createdAt | date:'medium' }}</span>
                        @if (a.actorEmail) {
                          <span class="dot">•</span>
                          <span>{{ a.actorEmail }}</span>
                        }
                      </div>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      }

      <!-- Audit Tab -->
      @if (currentTab() === 'audit') {
        <div class="card">
          <div class="card-header">
            <input class="input" placeholder="Search audit events..." (keyup.enter)="loadAudit(q.value)" #q/>
            <button class="btn" (click)="loadAudit(q.value)">Search</button>
            <div class="spacer"></div>
            <div class="muted">Showing audit logs for this tenant</div>
          </div>

          <div *ngIf="auditLoading()" class="empty">Loading audit logs...</div>
          <div *ngIf="!auditLoading() && !auditResults()?.items?.length" class="empty">No audit logs found.</div>

          <div *ngIf="!auditLoading() && auditResults()?.items?.length">
            <host-simple-table
              [columns]="auditColumns"
              [data]="auditResults()?.items ?? []"
              [idKey]="'id'"
              (rowClick)="onAuditRowClick($event)"
              (view)="selectAudit($event.id)"
            >
              <ng-template #actionTemplate let-row="row">
                <button class="btn small" (click)="$event.stopPropagation(); selectAudit(row.id)">View</button>
                <button class="btn small" (click)="$event.stopPropagation();">Export</button>
              </ng-template>
            </host-simple-table>

            <div class="pager">
              <div class="muted">Showing {{ (auditResults()?.items?.length ?? 0) }} of {{ auditResults()?.total ?? 0 }}</div>

              <div class="pager-actions">
                <button class="btn small" (click)="auditPrev()" [disabled]="auditPage() <= 1">Prev</button>
                <span class="page">{{ auditPage() }}</span>
                <button class="btn small" (click)="auditNext()" [disabled]="auditPage()*auditPageSize() >= (auditResults()?.total ?? 0)">Next</button>

                <select class="input small" [ngModel]="auditPageSize()" (ngModelChange)="setAuditPageSize($event)">
                  <option [ngValue]="10">10</option>
                  <option [ngValue]="20">20</option>
                  <option [ngValue]="50">50</option>
                </select>
              </div>
            </div>
          </div>

          <div *ngIf="selectedAudit()" class="card detail">
            <div class="label">Audit detail</div>
            <pre>{{ selectedAudit() | json }}</pre>
          </div>
        </div>
      }

      <!-- Users Tab -->
      @if (currentTab() === 'users') {
        <div class="card">
          <div class="section-title">Tenant users</div>
          <div class="empty">Coming soon — list of users for this tenant.</div>
        </div>
      }

      <!-- Invoices Tab -->
      @if (currentTab() === 'invoices') {
        <div class="card">
          <div class="section-title">Invoices</div>
          <div class="empty">Coming soon — invoices and billing history.</div>
        </div>
      }

      <!-- Issues Tab -->
      @if (currentTab() === 'issues') {
        <div class="card">
          <div class="section-title">Issues</div>
          <div class="empty">Coming soon — issues & support tickets.</div>
        </div>
      }

    </host-data-table-shell>
  `,
  styles: [`
    .crumbs { margin-bottom: 10px; }
    .crumbs a { text-decoration: none; color: #374151; }

    .btn { border: 1px solid #e5e7eb; background: #fff; padding: 10px 12px; border-radius: 10px; cursor: pointer; }
    .btn.danger { border-color: #fecaca; background: #fff; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }

    /* Tabs */
    .tabs { display:flex; gap:8px; margin: 14px 0; }
    .tab { background: transparent; border: none; padding: 10px 14px; border-radius: 10px; cursor: pointer; color: #6b7280; }
    .tab.active { background: #0ea5e9; color: #fff; }

    .card-header { display:flex; align-items:center; gap:12px; padding: 12px; border-bottom: 1px solid #f1f5f9; }
    .card-header .search { flex: 1; padding: 8px 10px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .spacer { flex: 1; }

    .pager { display:flex; gap:12px; align-items:center; padding: 12px; }
    .card.detail { margin:12px; padding:12px; background:#fff; border-radius:10px; }


    .overview { display: grid; gap: 14px; }

    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    @media (max-width: 960px) { .summary { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .summary { grid-template-columns: 1fr; } }

    .summary-card {
      border: 1px solid #e5e7eb;
      background: #fff;
      border-radius: 14px;
      padding: 12px;
    }

    .label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; display: flex; align-items: center; gap: 8px; }
    .label .icon { font-size: 14px; opacity: .9; }
    .value { font-size: 20px; font-weight: 700; margin-top: 6px; }
    .muted { color: #6b7280; font-size: 12px; margin-top: 4px; }

    .pill {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
      font-weight: 600;
    }
    .pill.suspended { border-color: #fecaca; background: #fef2f2; }
    .pill.trial { border-color: #bfdbfe; background: #eff6ff; }

    .section-title {
      margin-top: 6px;
      font-weight: 700;
      color: #111827;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
    }
    @media (max-width: 1200px) { .metrics { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 1024px) { .metrics { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 640px) { .metrics { grid-template-columns: 1fr; } }

    .metric {
      border: 1px solid #e5e7eb;
      background: #fff;
      border-radius: 14px;
      padding: 12px;
    }

    .card {
      border: 1px solid #e5e7eb;
      background: #fff;
      border-radius: 14px;
      overflow: hidden;
    }

    /* Table (consistent with Tenants list) */
    .table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.45; color: #111827; }
    th, td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; text-align: left; vertical-align: top; }
    th { font-size: 12px; color: #374151; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; background: rgba(15,23,42,0.02); }
    td { color: #111827; font-size: 14px; }
    .right { text-align: right; }
    .name { font-weight: 700; font-size: 16px; color: #111827; }

    .empty { padding: 18px; color: #6b7280; }

    .activity { list-style: none; margin: 0; padding: 0; }
    .row { border-top: 1px solid #f1f5f9; padding: 12px; }
    .row:first-child { border-top: none; }

    .msg { font-weight: 600; }
    .meta { color: #6b7280; font-size: 12px; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .type { border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 999px; background: #f9fafb; }
    .dot { opacity: .7; }
  `],
})
export class TenantDetailsPage {
  private api = inject(HostApi);
  private route = inject(ActivatedRoute);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);

  tenantId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  tenant = signal<TenantDetails | null>(null);
  metrics = signal<TenantMetrics | null>(null);
  activity = signal<TenantActivityItem[]>([]);

  // Tab state
  currentTab = signal<'overview' | 'audit' | 'users' | 'invoices' | 'issues'>('overview');

  // Audit data
  auditResults = signal<PagedResult<AuditEvent> | null>(null);
  auditPage = signal(1);
  auditPageSize = signal(20);
  auditLoading = signal(false);
  selectedAudit = signal<AuditEvent | null>(null);

  loading = signal(false);
  error = signal<string | null>(null);

  // Columns for the shared simple table
  auditColumns: SimpleColumn[] = [
    { key: 'action', label: 'Action' },
    { key: 'category', label: 'Category' },
    { key: 'actorEmailSnapshot', label: 'Actor' },
    { key: 'timestamp', label: 'When' },
    { key: 'result', label: 'Result' },
  ];

  onAuditRowClick(row: any) {
    this.selectAudit(row.id);
  }

  tenantTitle = computed(() => this.tenant()?.name ?? 'Tenant');
  tenantSubtitle = computed(() => {
    const t = this.tenant();
    if (!t) return 'Tenant overview';
    return `${t.subdomain} • ${t.editionName ?? 'No edition'}`;
  });

  publicUrl() {
    const t = this.tenant();
    if (!t) return null;
    const domain = t.customDomain ?? `${t.subdomain}.yourapp.com`;
    return `https://${domain}`;
  }

  async ngOnInit() {
    await this.reload();
  }

  setTab(tab: 'overview' | 'audit' | 'users' | 'invoices' | 'issues') {
    this.currentTab.set(tab);
    if (tab === 'audit') this.loadAudit();
  }

  async loadAudit(q?: string) {
    const id = this.tenantId();
    if (!id) return;
    this.auditLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.getTenantAudit(id, this.auditPage(), this.auditPageSize(), q));
      this.auditResults.set(res);
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Failed to load audit logs');
    } finally {
      this.auditLoading.set(false);
    }
  }

  auditPrev() {
    const p = Math.max(1, this.auditPage() - 1);
    this.auditPage.set(p);
    this.loadAudit();
  }

  auditNext() {
    const p = this.auditPage() + 1;
    this.auditPage.set(p);
    this.loadAudit();
  }

  async selectAudit(id: string) {
    try {
      const a = await firstValueFrom(this.api.getAuditEvent(id));
      this.selectedAudit.set(a);
    } catch (e: any) {
      this.toast.error('Failed to load audit detail');
    }
  }

  trackByAuditId(_: number, e: any) { return e.id; }

  setAuditPageSize(size: any) {
    const s = Number(size) || 10;
    this.auditPageSize.set(s);
    this.auditPage.set(1);
    this.loadAudit();
  }

  auditTotalPages() {
    const total = this.auditResults()?.total ?? 0;
    const pageSize = this.auditPageSize() || 20;
    return Math.max(1, Math.ceil(total / pageSize));
  }

  async reload() {
    const id = this.tenantId();
    if (!id) {
      this.error.set('Missing tenant id');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const [t, m, a] = await Promise.all([
        firstValueFrom(this.api.getTenantDetails(id)),
        firstValueFrom(this.api.getTenantMetrics(id)),
        firstValueFrom(this.api.getTenantActivity(id, 20)),
      ]);

      this.tenant.set(t);
      this.metrics.set(m);
      this.activity.set(a);

      if (this.currentTab() === 'audit') {
        this.loadAudit();
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to load tenant details');
      this.toast.error('Failed to load tenant details');
    } finally {
      this.loading.set(false);
    }
  }

  storageLabel(): string {
    const m = this.metrics();
    if (!m) return '—';
    if (m.storageUsedMb === undefined) return '—';
    if (m.storageLimitMb) return `${m.storageUsedMb} / ${m.storageLimitMb} MB`;
    return `${m.storageUsedMb} MB`;
  }

  mrrLabel(): string {
    const m = this.metrics();
    if (!m || m.mrr === undefined) return '—';
    const currency = m.currency ?? 'USD';
    return `${currency} ${m.mrr}`;
  }

  openEdit() {
    // Keep this simple for now:
    // Later, you can reuse TenantFormDialogComponent in a route-level dialog.
    this.toast.success('Edit flow: reuse the tenant edit dialog from the list (next enhancement)');
  }

  async suspend() {
    const t = this.tenant();
    if (!t) return;

    const ok = await this.confirm.confirm(`Suspend "${t.name}"? Users may be unable to access the tenant.`);
    if (!ok) return;

    try {
      await firstValueFrom(this.api.suspendTenant(t.id));
      this.toast.success('Tenant suspended');
      await this.reload();
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Failed to suspend tenant');
    }
  }

  async activate() {
    const t = this.tenant();
    if (!t) return;

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
