import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconRegistryService } from '../../services/icon-registry.service';
import { TenantService, Tenant } from '../../../core/services/tenant.service';
import { SchoolSettingsService } from '../../../core/services/school-settings.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside
      class="sidebar"
      [class.sidebar-collapsed]="collapsed && !isMobile"
      [class.is-mobile]="isMobile"
      [class.open]="isMobile && mobileOpen"
      [attr.id]="sidebarId"
      role="navigation"
      [attr.aria-label]="ariaLabel"
    >
      <div class="sidebar-header">
        <div class="identity">
          <div class="brand-mark">
            <ng-container *ngIf="tenantLogo; else defaultLogo">
              <img [src]="tenantLogo" alt="Tenant logo" class="logo-img" loading="lazy" />
            </ng-container>
            <ng-template #defaultLogo>
              <span class="nav-icon" [innerHTML]="icon('dashboard')"></span>
            </ng-template>
          </div>
          <div class="brand-text" *ngIf="!collapsed">
            <div class="brand-name">{{ tenantName || 'MindBloom' }}</div>
            <div class="brand-sub">School OS</div>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <section class="nav-section" *ngFor="let section of navSections">
          <header class="nav-section-title" *ngIf="!collapsed">{{ section.title }}</header>
          <div class="nav-card">
            <a
              class="nav-link"
              *ngFor="let item of section.items"
              [routerLink]="item.path"
              routerLinkActive="active"
              #rla="routerLinkActive"
              [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
              [attr.aria-current]="rla.isActive ? 'page' : null"
              (click)="onNavigate()">
              <span class="nav-link-icon" [innerHTML]="icon(item.icon)"></span>
              <span class="nav-link-text" *ngIf="!collapsed">{{ item.label }}</span>
              <span class="nav-badge" *ngIf="item.badge && !collapsed">{{ item.badge }}</span>
            </a>
          </div>
        </section>
      </nav>

      <div class="sidebar-footer">
        <div class="footer-cta" *ngIf="!collapsed">
          <button type="button" class="ghost">Try demo</button>
          <button type="button" class="ghost">Need help?</button>
        </div>
        <div class="user-profile" (click)="logout()">
          <div class="user-avatar">{{ getUserInitials() }}</div>
          <div class="user-info" *ngIf="!collapsed">
            <div class="user-name">{{ currentUser?.name }}</div>
            <div class="user-role">{{ currentUser?.role }}</div>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .sidebar {
      --accent-primary: var(--color-primary, #8bc6ff);
      --surface-sidebar: var(--color-surface, #0f172a);
      --surface-hover: color-mix(in srgb, var(--color-surface-hover, rgba(255,255,255,0.04)) 90%, transparent);
      --text-primary: var(--color-text-primary, #e5e7eb);
      --text-secondary: var(--color-text-secondary, #9ca3af);
      --text-muted: color-mix(in srgb, var(--color-text-secondary, #9ca3af) 75%, transparent);
      --border-subtle: var(--color-border, rgba(255,255,255,0.08));
      position: sticky;
      top: 0;
      height: 100vh;
      width: var(--sidebar-width, 270px);
      padding: 1rem 0.75rem;
      box-sizing: border-box;
      background: var(--surface-sidebar);
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      border-right: 1px solid var(--border-subtle);
      transition: width 0.25s ease, padding 0.25s ease;
      overflow: hidden;
    }
    .sidebar.sidebar-collapsed { width: 84px; padding: 1rem 0.55rem; }

    .sidebar-header {
      position: sticky;
      top: 0;
      padding: 0.2rem 0.4rem 0.6rem;
      background: var(--surface-sidebar);
      z-index: 2;
    }

    .identity {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.35rem 0.4rem;
      border-radius: 8px;
    }

    .brand-mark {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      background: color-mix(in srgb, #ffffff 6%, transparent);
      border: 1px solid color-mix(in srgb, var(--border-subtle) 80%, transparent);
    }
    .logo-img { width: 28px; height: 28px; object-fit: cover; border-radius: 8px; }
    .brand-text { display: flex; flex-direction: column; min-width: 0; }
    .brand-name { font-weight: 600; letter-spacing: -0.01em; line-height: 1.2; color: var(--text-primary); }
    .brand-sub { font-size: 0.78rem; color: var(--text-muted); line-height: 1.2; }

    .sidebar-nav { flex: 1; min-height: 0; overflow-y: auto; padding: 0.25rem 0.15rem 1rem; scroll-behavior: smooth; }

    .nav-section { display: grid; gap: 4px; }

    .nav-section-title {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
      padding: 0 0.9rem;
      margin-top: 1rem;
      margin-bottom: 0.35rem;
      font-weight: 600;
    }

    .nav-card {
      display: grid;
      gap: 4px;
      padding: 0;
    }

    .nav-link {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      height: 40px;
      padding: 0 0.9rem;
      border-radius: 8px;
      color: var(--text-secondary);
      text-decoration: none;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .nav-link::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 3px;
      border-radius: 2px;
      background: transparent;
      transition: background-color 0.2s ease;
    }

    .nav-link:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .nav-link:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 2px;
    }

    .nav-link.active {
      background: transparent;
      color: var(--text-primary);
      font-weight: 600;
    }

    .nav-link.active::before {
      background: var(--accent-primary);
    }

    .nav-link-icon {
      width: 18px;
      height: 18px;
      display: inline-flex;
      color: var(--text-secondary);
      opacity: 0.85;
      transition: color 0.2s ease, opacity 0.2s ease;
    }

    .nav-link:hover .nav-link-icon { color: var(--text-primary); opacity: 1; }
    .nav-link.active .nav-link-icon { color: var(--accent-primary); opacity: 1; }

    .nav-link-text { font-weight: 500; letter-spacing: -0.01em; font-size: 14px; line-height: 1; }

    .nav-badge {
      margin-left: auto;
      min-width: 28px;
      text-align: center;
      background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
      color: var(--accent-primary);
      padding: 0.15rem 0.45rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.7rem;
      text-transform: uppercase;
    }

    .sidebar.sidebar-collapsed .nav-section-title { display: none; }
    .sidebar.sidebar-collapsed .nav-link { justify-content: center; padding: 0 0.65rem; }
    .sidebar.sidebar-collapsed .nav-link-text, .sidebar.sidebar-collapsed .nav-badge { display: none; }

    .sidebar-footer { margin-top: auto; display: grid; gap: 0.4rem; padding: 0.6rem 0.9rem 0.4rem; color: var(--text-secondary); }
    .footer-cta { display: none; }
    .user-profile {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.55rem 0.65rem;
      border-radius: 8px;
      background: transparent;
      border: 1px solid color-mix(in srgb, var(--border-subtle) 60%, transparent);
      cursor: pointer;
      transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
    }
    .user-profile:hover {
      background: var(--surface-hover);
      border-color: var(--accent-primary);
      color: var(--text-primary);
    }
    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      background: color-mix(in srgb, var(--accent-primary) 30%, transparent);
      color: var(--text-primary);
      font-weight: 700;
    }
    .user-info { display: grid; gap: 0.05rem; }
    .user-name { font-weight: 600; color: var(--text-primary); }
    .user-role { font-size: 0.85rem; color: var(--text-secondary); }
    .sidebar.sidebar-collapsed .user-info { display: none; }

    .sidebar.is-mobile {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      height: 100vh;
      width: min(320px, 85vw);
      max-width: 360px;
      transform: translateX(-100%);
      transition: transform 0.28s ease;
      box-shadow: 10px 0 30px rgba(0,0,0,0.35);
      z-index: 200;
      overflow: hidden;
    }

    .sidebar.is-mobile.open {
      transform: translateX(0);
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        height: 100vh;
        width: min(320px, 85vw);
        max-width: 360px;
        transform: translateX(-100%);
        transition: transform 0.28s ease;
        box-shadow: 10px 0 30px rgba(0,0,0,0.35);
        z-index: 200;
        overflow: hidden;
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .sidebar.sidebar-collapsed {
        width: min(320px, 85vw);
        padding: 1rem 0.75rem;
      }

      .sidebar-nav { padding-right: 0.25rem; }
    }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Input() isMobile = false;
  @Input() mobileOpen = false;
  @Input() sidebarId = 'app-sidebar';
  @Input() ariaLabel = 'Main navigation';
  @Output() navigate = new EventEmitter<void>();
  currentUser: any;
  tenantLogo: string | null = null;
  tenantName: string | null = null;
  private schoolLogo: string | null = null;
  private tenantFavicon: string | null = null;
  private schoolFavicon: string | null = null;

  navSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' }
      ]
    },
    {
      title: 'Students',
      items: [
        { label: 'Workspace', path: '/students', icon: 'dashboard' },
        { label: 'Admissions', path: '/admissions', icon: 'tasks' },
        { label: 'Attendance', path: '/students/attendance', icon: 'calendar' },
        { label: 'Academics', path: '/students/academics', icon: 'tasks' },
        { label: 'Conduct', path: '/conduct', icon: 'people' },
        { label: 'Health', path: '/students/health', icon: 'health' },
        { label: 'Documents', path: '/students/documents', icon: 'library' },
        { label: 'Finance', path: '/accounting/fees', icon: 'fees' },
        { label: 'Reports', path: '/reports', icon: 'tasks' }
      ]
    },
    {
      title: 'Finance & Reporting',
      items: [
        { label: 'Fee Management', path: '/accounting/fees', icon: 'fees' },
        { label: 'Fee Structures', path: '/accounting/fee-structures', icon: 'settings' },
        { label: 'Fee Reports', path: '/accounting/fee-reports', icon: 'reports' },
        { label: 'Accounts Payable', path: '/accounting/payables', icon: 'expense' },
        { label: 'Expense Records', path: '/accounting/expenses', icon: 'expense' },
        { label: 'Bills Queue', path: '/accounting/bill-queue', icon: 'bill' },
        { label: 'General Ledger', path: '/accounting/gl', icon: 'bank' },
        { label: 'Chart of Accounts', path: '/accounting/accounts', icon: 'list' },
        { label: 'Journal Entries', path: '/accounting/journals', icon: 'journal' },
        { label: 'Bank Reconciliation', path: '/accounting/bank-recon', icon: 'check-circle' },
        { label: 'Analytics', path: '/reports/analytics', icon: 'dashboard' },
        { label: 'Financial Reports', path: '/reports/financial', icon: 'file-text' },
        { label: 'Data Exports', path: '/reports/exports', icon: 'download' }
      ]
    },
    {
      title: 'Human Resources',
      items: [
        { label: 'Directory', path: '/hr/directory', icon: 'hr' },
        { label: 'Profiles', path: '/hr/profiles', icon: 'dashboard' },
        { label: 'Leave', path: '/hr/leave', icon: 'calendar' },
        { label: 'Attendance', path: '/hr/attendance', icon: 'tasks' },
        { label: 'Settings', path: '/hr/settings', icon: 'settings' }
      ]
    },
    {
      title: 'System',
      items: [
        { label: 'Tenant Settings', path: '/setup/tenant-settings', icon: 'settings' },
        { label: 'Marketplace', path: '/setup/marketplace', icon: 'marketplace' },
        { label: 'Plugins', path: '/plugins', icon: 'plugins' },
        { label: 'Tasks', path: '/tasks', icon: 'tasks' }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private icons: IconRegistryService,
    private tenantService: TenantService,
    private schoolSettingsService: SchoolSettingsService
  ) { }

  icon(name: string) {
    return this.icons.icon(name);
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
    });
    this.tenantService.currentTenant$.subscribe((tenant: Tenant | null) => {
      this.tenantLogo = tenant?.customization?.logo || tenant?.customization?.favicon || null;
      this.tenantFavicon = tenant?.customization?.favicon || tenant?.customization?.logo || null;
      this.tenantName = tenant?.name || null;
      if (!this.tenantLogo) {
        this.tenantLogo = this.schoolLogo;
      }
      if (this.tenantFavicon) {
        this.setFavicon(this.tenantFavicon);
      }
    });
    this.schoolSettingsService.getSettings().subscribe(settings => {
      this.schoolLogo = settings.logoUrl || settings.faviconUrl || null;
      this.schoolFavicon = settings.faviconUrl || settings.logoUrl || null;
      if (!this.tenantLogo && this.schoolLogo) {
        this.tenantLogo = this.schoolLogo;
      }
      if (!this.tenantName && settings.schoolName) {
        this.tenantName = settings.schoolName;
      }
      if (!this.tenantFavicon && this.schoolFavicon) {
        this.setFavicon(this.schoolFavicon);
      }
    });
  }

  private setFavicon(url: string) {
    if (!url) return;
    const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = url;
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) return 'U';
    return this.currentUser.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  logout(): void {
    this.authService.logout();
  }

  onNavigate(): void {
    this.navigate.emit();
  }
}
