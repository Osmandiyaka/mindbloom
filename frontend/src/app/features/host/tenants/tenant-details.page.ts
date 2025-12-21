import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { HostApi } from '../../../core/api/host-api';
import { TenantActivityItem, TenantDetails, TenantMetrics, AuditEvent, PagedResult, TenantUser } from '../../../core/api/models';

import { PageHeaderComponent } from '../../../core/ui/page-header/page-header.component';
import { UiButtonComponent } from '../../../shared/ui/buttons/ui-button.component';
import { UiInputComponent } from '../../../shared/ui/forms/ui-input.component';
import { UiSelectComponent } from '../../../shared/ui/forms/ui-select.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { DataTableShellComponent } from '../../../core/ui/data-table-shell/data-table-shell.component';
import { SimpleTableComponent, SimpleColumn } from '../../../core/ui/simple-table/simple-table.component';

import { ConfirmService } from '../../../core/ui/confirm/confirm.service';
import { ToastService } from '../../../core/ui/toast/toast.service';
import { AuthService } from '../../../core/auth/auth.service';
import { TenantBootstrapService } from '../../../core/tenant/tenant-bootstrap.service';
import { AuthSession, TenantMembership } from '../../../core/auth/auth.models';

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

    // Shared UI primitives
    UiButtonComponent,
    UiInputComponent,
    UiSelectComponent,
    BadgeComponent,
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
      <ui-button (click)="reload()">Refresh</ui-button>
      <ui-button (click)="openEdit()" [disabled]="loading()">Edit</ui-button>

      @if (tenant()?.status !== 'SUSPENDED') {
        <ui-button variant="danger" (click)="suspend()" [disabled]="loading()">Suspend</ui-button>
      } @else {
        <ui-button (click)="activate()" [disabled]="loading()">Activate</ui-button>
      }

      <ui-button variant="ghost" (click)="impersonateTenant()" [disabled]="loading() || impersonating()">Impersonate</ui-button>
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
            <ui-input #q [placeholder]="'Search audit events...'" (valueChange)="undefined"></ui-input>
            <ui-button (click)="loadAudit(q?.value)">Search</ui-button>
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
                <ui-button size="sm" (click)="$event.stopPropagation(); selectAudit(row.id)">View</ui-button>
                <ui-button size="sm" (click)="$event.stopPropagation();">Export</ui-button>
              </ng-template>
            </host-simple-table>

            <div class="pager">
              <div class="muted">Showing {{ (auditResults()?.items?.length ?? 0) }} of {{ auditResults()?.total ?? 0 }}</div>

              <div class="pager-actions">
                <button class="btn small" (click)="auditPrev()" [disabled]="auditPage() <= 1">Prev</button>
                <span class="page">{{ auditPage() }}</span>
                <button class="btn small" (click)="auditNext()" [disabled]="auditPage()*auditPageSize() >= (auditResults()?.total ?? 0)">Next</button>

                <ui-select [value]="auditPageSize()" (valueChange)="setAuditPageSize($event)">
                  <option [value]="10">10</option>
                  <option [value]="20">20</option>
                  <option [value]="50">50</option>
                </ui-select>
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
          <div class="card-header">
            <div>
              <div class="section-title">Tenant users</div>
              <div class="muted">Host view of all users in this tenant.</div>
            </div>
            <div class="spacer"></div>
            <ui-button size="sm" (click)="loadUsers(true)" [disabled]="tenantUsersLoading()">Refresh</ui-button>
          </div>

          <div *ngIf="tenantUsersLoading()" class="empty">Loading users...</div>
          <div *ngIf="tenantUsersError()" class="empty">{{ tenantUsersError() }}</div>
          <div *ngIf="!tenantUsersLoading() && !tenantUsersError() && !tenantUsers().length" class="empty">No users found.</div>

          <div *ngIf="!tenantUsersLoading() && !tenantUsersError() && tenantUsers().length">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th class="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of tenantUsers(); track u.id) {
                  <tr>
                    <td class="name">{{ u.name || '—' }}</td>
                    <td>{{ u.email }}</td>
                    <td>{{ u.role?.name ?? '—' }}</td>
                    <td>{{ u.createdAt ? (u.createdAt | date:'mediumDate') : '—' }}</td>
                    <td class="right">
                      <ui-button size="sm" variant="ghost" [disabled]="impersonating()" (click)="impersonate(u)">Impersonate</ui-button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Invoices Tab -->
      @if (currentTab() === 'invoices') {
        <div class="card">
          <div class="card-header">
            <div>
              <div class="section-title">Invoices</div>
              <div class="muted">Recent billing for this tenant.</div>
            </div>
            <div class="spacer"></div>
            <ui-button size="sm" variant="ghost" [disabled]="loading()">Export</ui-button>
          </div>

          @if (!invoiceRows().length) {
            <div class="empty">No invoices yet.</div>
          } @else {
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Due</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                @for (inv of invoiceRows(); track inv.id) {
                  <tr>
                    <td class="cell-primary">{{ inv.number }}</td>
                    <td class="cell-secondary">{{ inv.period }}</td>
                    <td>
                      <app-badge size="sm" [dot]="true" [variant]="invoiceStatusVariant(inv.status)">{{ inv.status }}</app-badge>
                    </td>
                    <td>{{ inv.amount }}</td>
                    <td class="cell-secondary">{{ inv.dueDate }}</td>
                    <td class="cell-secondary">{{ inv.paidDate || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      <!-- Issues Tab -->
      @if (currentTab() === 'issues') {
        <div class="card">
          <div class="card-header">
            <div>
              <div class="section-title">Issues</div>
              <div class="muted">Support and incidents logged for this tenant.</div>
            </div>
            <div class="spacer"></div>
            <ui-button size="sm" variant="ghost" [disabled]="loading()">New Issue</ui-button>
          </div>

          @if (!issueRows().length) {
            <div class="empty">No issues reported.</div>
          } @else {
            <table class="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                @for (issue of issueRows(); track issue.id) {
                  <tr>
                    <td class="cell-primary">{{ issue.title }}</td>
                    <td>
                      <app-badge size="sm" [dot]="true" [variant]="issueSeverityVariant(issue.severity)">{{ issue.severity }}</app-badge>
                    </td>
                    <td>
                      <app-badge size="sm" [dot]="true" [variant]="issueStatusVariant(issue.status)">{{ issue.status }}</app-badge>
                    </td>
                    <td class="cell-secondary">{{ issue.updatedAt }}</td>
                    <td class="cell-secondary">{{ issue.owner }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
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

    :host ::ng-deep host-page-header .description {
      color: #0f172a !important;
      font-weight: 700;
      opacity: 1;
    }

    /* High-contrast buttons */
    :host ::ng-deep ui-button button,
    :host ::ng-deep button.btn,
    .btn {
      color: #111827;
      font-weight: 700;
      border: 1px solid #111827;
      background: #fff;
      box-shadow: none;
    }
    :host ::ng-deep ui-button[variant="primary"] button,
    .btn.primary {
      background: #111827;
      color: #fff;
      border-color: #111827;
    }
    :host ::ng-deep ui-button[variant="ghost"] button,
    :host ::ng-deep ui-button[variant="secondary"] button,
    .btn.secondary,
    .btn.ghost {
      background: #fff;
      color: #111827;
      border-color: #111827;
    }
    :host ::ng-deep ui-button[variant="danger"] button,
    .btn.danger {
      background: #fff;
      color: #b91c1c;
      border-color: #b91c1c;
    }
    .btn:disabled,
    :host ::ng-deep ui-button button:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    /* Tabs */
    .tabs { display:flex; gap:8px; margin: 14px 0; }
    .tab { background: transparent; border: 1px solid var(--host-border-subtle); padding: 10px 14px; border-radius: 10px; cursor: pointer; color: var(--host-tab-text, var(--host-muted-color)); font-weight: 600; transition: background .12s, color .12s, box-shadow .12s; }
    .tab:hover { background: var(--host-tab-bg-hover, color-mix(in srgb, var(--host-surface-muted) 80%, transparent 20%)); color: var(--host-text-color); }
    .tab.active { background: var(--host-accent); color: var(--host-accent-text, var(--btn-primary-text)); box-shadow: var(--host-primary-glow, none); border-color: color-mix(in srgb, var(--host-accent) 40%, transparent 60%); }

    .card-header { display:flex; align-items:center; gap:12px; padding: 12px; border-bottom: 1px solid var(--host-border-subtle); }
    .card-header .search { flex: 1; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--host-border-subtle); background: var(--host-surface-elevated); }
    .spacer { flex: 1; }

    .pager { display:flex; gap:12px; align-items:center; padding: 12px; }
    .card.detail { margin:12px; padding:12px; background: var(--host-surface-elevated); border-radius:10px; box-shadow: var(--shadow-sm); }


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

    .label { color: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; display: flex; align-items: center; gap: 8px; }
    .label .icon { font-size: 14px; opacity: .9; }
    .value { font-size: 20px; font-weight: 700; margin-top: 6px; color: #0f172a; }
    .muted { color: #0f172a; font-size: 12px; margin-top: 4px; }

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
      color: #0f172a;
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
      border: 1px solid var(--host-border-subtle);
      background: var(--host-surface-elevated);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: var(--host-shadow, 0 6px 18px rgba(0,0,0,0.06));
    }

    /* Table (consistent with Tenants list) */
    .table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.45; color: #111827; }
    th, td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; text-align: left; vertical-align: top; }
    th { font-size: 12px; color: #374151; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; background: rgba(15,23,42,0.02); }
    td { color: #111827; font-size: 14px; }
    .right { text-align: right; }
    .name { font-weight: 700; font-size: 16px; color: #111827; }

    .empty { padding: 18px; color: #0f172a; }

    .activity { list-style: none; margin: 0; padding: 0; }
    .row { border-top: 1px solid #f1f5f9; padding: 12px; }
    .row:first-child { border-top: none; }

    .msg { font-weight: 600; }
    .meta { color: #0f172a; font-size: 12px; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .type { border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 999px; background: #f9fafb; }
    .dot { opacity: .7; }
  `],
})
export class TenantDetailsPage {
  private api = inject(HostApi);
  private route = inject(ActivatedRoute);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private tenantBootstrap = inject(TenantBootstrapService);

  tenantId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  tenant = signal<TenantDetails | null>(null);
  metrics = signal<TenantMetrics | null>(null);
  activity = signal<TenantActivityItem[]>([]);
  tenantUsers = signal<TenantUser[]>([]);
  tenantUsersLoading = signal(false);
  tenantUsersError = signal<string | null>(null);

  // Tab state
  currentTab = signal<'overview' | 'audit' | 'users' | 'invoices' | 'issues'>('overview');

  // Audit data
  auditResults = signal<PagedResult<AuditEvent> | null>(null);
  auditPage = signal(1);
  auditPageSize = signal(20);
  auditLoading = signal(false);
  selectedAudit = signal<AuditEvent | null>(null);

  impersonating = signal(false);

  // Stub data for invoices and issues (replace with real API when available)
  invoiceRows = signal([
    { id: 'inv-1005', number: 'INV-1005', period: 'Nov 2025', status: 'PAID', amount: '$420.00', dueDate: 'Nov 15, 2025', paidDate: 'Nov 12, 2025' },
    { id: 'inv-1004', number: 'INV-1004', period: 'Oct 2025', status: 'PAST_DUE', amount: '$420.00', dueDate: 'Oct 15, 2025', paidDate: '' },
    { id: 'inv-1003', number: 'INV-1003', period: 'Sep 2025', status: 'PAID', amount: '$420.00', dueDate: 'Sep 15, 2025', paidDate: 'Sep 14, 2025' },
  ]);

  issueRows = signal([
    { id: 'iss-12', title: 'SSO login failing intermittently', severity: 'HIGH', status: 'OPEN', updatedAt: 'Dec 11, 2025', owner: 'ops@mindbloom.io' },
    { id: 'iss-11', title: 'Report export timing out', severity: 'MEDIUM', status: 'IN_PROGRESS', updatedAt: 'Dec 5, 2025', owner: 'reports@mindbloom.io' },
    { id: 'iss-10', title: 'Library sync mismatch', severity: 'LOW', status: 'RESOLVED', updatedAt: 'Nov 22, 2025', owner: 'plugins@mindbloom.io' },
  ]);

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
    if (tab === 'users') this.loadUsers();
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

  async loadUsers(force = false) {
    const id = this.tenantId();
    if (!id) return;
    if (!force && (this.tenantUsers().length || this.tenantUsersLoading())) return;

    this.tenantUsersLoading.set(true);
    this.tenantUsersError.set(null);

    try {
      const res = await firstValueFrom(this.api.getTenantUsers(id));
      this.tenantUsers.set(res ?? []);
    } catch (e: any) {
      this.tenantUsersError.set(e?.message ?? 'Failed to load users');
      this.toast.error('Failed to load users');
    } finally {
      this.tenantUsersLoading.set(false);
    }
  }

  async impersonate(user: TenantUser) {
    const t = this.tenant();
    if (!t) return;
    const ok = await this.confirm.confirm(`Impersonate ${user.name || user.email}? This will start a session as that tenant user.`);
    if (!ok) return;
    if (this.impersonating()) return;

    this.impersonating.set(true);
    try {
      const response = await firstValueFrom(this.api.impersonateTenantUser(t.id, user.id, 'Host console user impersonation'));
      const session = this.auth.applyLoginResponse(response as any);
      await this.applyImpersonationSession(session, t.name);
      await this.router.navigate(['/dashboard']);
      this.toast.success(`Now impersonating ${user.name || user.email}`);
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Failed to impersonate user');
    } finally {
      this.impersonating.set(false);
    }
  }

  async impersonateTenant() {
    const t = this.tenant();
    if (!t || this.impersonating()) return;
    const ok = await this.confirm.confirm(`Impersonate "${t.name}"? You will switch into this tenant as an admin.`);
    if (!ok) return;

    this.impersonating.set(true);
    try {
      const response = await firstValueFrom(this.api.impersonateTenant(t.id, 'Host console tenant impersonation'));
      const session = this.auth.applyLoginResponse(response as any);
      await this.applyImpersonationSession(session, t.name);
      await this.router.navigate(['/dashboard']);
      this.toast.success(`Now impersonating ${t.name}`);
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Failed to impersonate tenant');
    } finally {
      this.impersonating.set(false);
    }
  }

  private async applyImpersonationSession(session: AuthSession, tenantName: string) {
    const memberships = session.memberships || [];
    const targetTenantId = session.activeTenantId || memberships[0]?.tenantId;
    const target = memberships.find(m => m.tenantId === targetTenantId) || memberships[0];

    if (target) {
      await firstValueFrom(this.tenantBootstrap.switchTenant(target as TenantMembership));
    } else {
      this.toast.warning(`Impersonated session for ${tenantName} has no tenant membership.`);
    }
  }

  resultVariant(result: string | null | undefined): 'success' | 'error' | 'warning' | 'neutral' {
    const value = (result ?? '').toString().toUpperCase();
    if (value === 'SUCCESS') return 'success';
    if (value === 'FAIL' || value === 'DENIED' || value === 'ERROR') return 'error';
    if (value === 'TRIAL' || value === 'PENDING') return 'warning';
    return 'neutral';
  }

  invoiceStatusVariant(status: string): 'success' | 'error' | 'warning' | 'neutral' {
    const value = (status || '').toUpperCase();
    if (value === 'PAID') return 'success';
    if (value === 'PAST_DUE' || value === 'FAILED') return 'error';
    if (value === 'PENDING' || value === 'ISSUED') return 'warning';
    return 'neutral';
  }

  issueSeverityVariant(severity: string): 'success' | 'error' | 'warning' | 'neutral' {
    const value = (severity || '').toUpperCase();
    if (value === 'HIGH' || value === 'CRITICAL') return 'error';
    if (value === 'MEDIUM') return 'warning';
    return 'neutral';
  }

  issueStatusVariant(status: string): 'success' | 'error' | 'warning' | 'neutral' {
    const value = (status || '').toUpperCase();
    if (value === 'RESOLVED' || value === 'CLOSED') return 'success';
    if (value === 'OPEN') return 'error';
    if (value === 'IN_PROGRESS') return 'warning';
    return 'neutral';
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
      if (this.currentTab() === 'users') {
        this.loadUsers(true);
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
