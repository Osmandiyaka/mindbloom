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
        <div class="brand logo-bar">
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
              [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
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
      --sb-shadow-deep: color-mix(in srgb, var(--color-shadow, rgba(0,0,0,0.26)) 88%, transparent);
      --sb-shadow-highlight: color-mix(in srgb, rgba(160,170,200,0.08) 70%, transparent);
      --sb-surface-strong: color-mix(in srgb, var(--color-surface, #0f172a) 92%, var(--color-surface-hover, #e2e8f0) 8%);
      --sb-gold: var(--color-primary, #E5C100);
      --sb-text: var(--color-text-primary, #cfc7bc);
      --sb-text-secondary: var(--color-text-secondary, #a39a90);
      --sh-dark-crisp: rgba(0,0,0,0.32);
      --sh-dark-deep: rgba(0,0,0,0.2);
      position: sticky;
      top: 0;
      height: 100vh;
      width: var(--sidebar-width, 270px);
      padding: 0.9rem;
      box-sizing: border-box;
      background: var(--sb-surface-strong);
      background-color: var(--color-surface-glass, color-mix(in srgb, var(--color-surface, #f8fafc) 80%, transparent));
      color: var(--sb-text);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow:
        inset -1px 0 0 color-mix(in srgb, var(--color-border, rgba(0,0,0,0.08)) 70%, transparent),
        inset 4px 4px 14px color-mix(in srgb, var(--sb-gold) 8%, transparent),
        8px 0 18px var(--sb-shadow-deep);
      transition: width 0.25s ease, padding 0.25s ease;
    }
    .sidebar.sidebar-collapsed { width: 84px; padding: 0.9rem 0.6rem; }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.2rem 0.25rem;
      background: rgba(255,255,255,0.02);
      border-radius: 14px;
    }
    .brand.logo-bar {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      flex: 1;
      min-width: 0;
      background: color-mix(in srgb, var(--color-surface, #0f172a) 80%, transparent);
      border-radius: 16px;
      padding: 0.4rem 0.55rem;
      box-shadow:
        2px 2px 6px var(--sh-dark-crisp),
        6px 8px 14px var(--sh-dark-deep),
        inset -1px -1px 4px color-mix(in srgb, var(--sb-gold) 10%, transparent);
    }
    .brand-mark {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 10px 18px rgba(0,0,0,0.26);
    }
    .logo-img { width: 32px; height: 32px; object-fit: cover; border-radius: 10px; }
    .brand-text { display: flex; flex-direction: column; min-width: 0; }
    .brand-name { font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; }
    .brand-sub { font-size: 0.82rem; color: var(--sb-text-secondary); line-height: 1.2; }
    .collapse-btn {
      width: 38px; height: 38px;
      border-radius: 12px;
      border: 1px solid color-mix(in srgb, var(--color-border, rgba(255,255,255,0.12)) 70%, transparent);
      background: color-mix(in srgb, var(--color-surface-hover, rgba(255,255,255,0.04)) 80%, transparent);
      color: var(--color-text-primary, #e8edf7);
      display: grid; place-items: center;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
      margin-left: auto;
    }
    .collapse-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.12); }

    .sidebar-nav { flex: 1; min-height: 0; overflow-y: auto; display: grid; gap: 0.9rem; padding-right: 0.15rem; scroll-behavior: smooth; }
    .nav-section-title {
      font-size: 0.85rem;
      font-weight: 400;
      color: var(--sb-text-secondary);
      padding: 0.15rem 0.3rem 0.5rem;
      margin: 0.55rem 0 0.35rem;
      letter-spacing: 0.08em;
      border-bottom: 1px solid color-mix(in srgb, var(--sb-gold) 14%, transparent);
      background: linear-gradient(90deg, color-mix(in srgb, var(--sb-gold) 6%, transparent), transparent);
    }
    .nav-card {
      background: color-mix(in srgb, var(--color-surface, #f8fafc) 85%, var(--color-surface-hover, #e2e8f0) 15%);
      border: 1px solid color-mix(in srgb, var(--color-border, rgba(0,0,0,0.08)) 75%, transparent);
      border-radius: 14px;
      box-shadow:
        inset 0 1px 0 var(--sb-shadow-highlight),
        0 16px 30px color-mix(in srgb, var(--color-shadow, rgba(0,0,0,0.22)) 90%, transparent);
      padding: 0.3rem;
      display: grid;
      gap: 0.25rem;
    }
    .nav-link {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.55rem 0.65rem;
      border-radius: 12px;
      color: var(--sb-text);
      text-decoration: none;
      transition:
        background-color 0.3s ease,
        color 0.3s ease,
        box-shadow 0.4s cubic-bezier(0.3, 1.1, 0.6, 1);
      box-shadow:
        inset 1.5px 1.5px 3px 0 color-mix(in srgb, var(--color-shadow, rgba(0,0,0,0.18)) 80%, transparent),
        inset -1.5px -1.5px 3px 0 color-mix(in srgb, var(--color-surface, #ffffff) 28%, transparent);
      text-shadow: 1px 1px 1px color-mix(in srgb, var(--sb-shadow-highlight) 60%, transparent);
      background-image: radial-gradient(120% 120% at 10% 10%, color-mix(in srgb, var(--sb-gold) 4%, transparent) 0%, transparent 45%);
    }
    .nav-link:hover {
      background: color-mix(in srgb, var(--sb-gold) 10%, var(--color-surface, #f8fafc));
      box-shadow:
        inset 2px 2px 5px 0 color-mix(in srgb, var(--color-shadow, rgba(0,0,0,0.22)) 82%, transparent),
        inset -2px -2px 5px 0 color-mix(in srgb, var(--color-surface, #ffffff) 32%, transparent),
        0 0 6px 0 color-mix(in srgb, var(--sb-shadow-deep) 24%, transparent);
      color: var(--color-text-primary, #0f172a);
    }
    .nav-link:focus-visible {
      outline: 2px solid var(--sb-gold);
      outline-offset: 2px;
    }
    .nav-link.active {
      background: var(--sb-gold);
      color: var(--color-text-on-primary, #0f172a);
      box-shadow:
        inset 1.5px 1.5px 3px 0 color-mix(in srgb, var(--color-shadow, rgba(0,0,0,0.18)) 78%, transparent),
        inset -1.5px -1.5px 3px 0 color-mix(in srgb, var(--color-surface, #ffffff) 32%, transparent),
        inset 0 0 2px 0 color-mix(in srgb, rgba(255,255,255,0.45) 60%, transparent),
        0 0 6px 0 color-mix(in srgb, var(--sb-gold) 22%, transparent);
    }
    .nav-link.active::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 8px;
      bottom: 8px;
      width: 3px;
      border-radius: 999px;
      background: var(--sb-gold);
      box-shadow: 0 0 6px color-mix(in srgb, var(--sb-gold) 55%, transparent);
    }
    .nav-link-icon {
      width: 20px;
      height: 20px;
      color: color-mix(in srgb, var(--sb-text-secondary) 60%, #ffffff 40%);
      display: inline-flex;
      transition: filter 0.2s ease, transform 0.2s ease, color 0.2s ease;
      transform: translateY(-1px);
    }
    .nav-link:hover .nav-link-icon {
      color: color-mix(in srgb, var(--sb-gold) 60%, #ffffff 40%);
      filter: drop-shadow(0 0 4px color-mix(in srgb, var(--sb-gold) 60%, transparent));
    }
    .nav-link.active .nav-link-icon {
      color: var(--color-text-on-primary, #0f172a);
      box-shadow: inset 0 0 1px rgba(0,0,0,0.4);
      transform: translateY(-1px) scale(1.05);
    }
    .nav-link-text { font-weight: 700; letter-spacing: -0.02em; }
    .nav-badge {
      margin-left: auto;
      min-width: 28px;
      text-align: center;
      background: color-mix(in srgb, var(--sb-gold) 20%, var(--color-surface, #0f172a));
      color: var(--color-text-on-primary, #0c2243);
      padding: 0.15rem 0.45rem;
      border-radius: 10px;
      font-weight: 800;
      font-size: 0.65rem;
      text-transform: uppercase;
    }

    .sidebar.sidebar-collapsed .nav-section-title { display: none; }
    .sidebar.sidebar-collapsed .nav-card { padding: 0.35rem; }
    .sidebar.sidebar-collapsed .nav-link { justify-content: center; padding: 0.55rem; }
    .sidebar.sidebar-collapsed .nav-link-text, .sidebar.sidebar-collapsed .nav-badge { display: none; }

    .sidebar-footer { margin-top: auto; display: grid; gap: 0.5rem; }
    .footer-cta { display: flex; justify-content: space-between; gap: 0.5rem; }
    .ghost {
      flex: 1;
      padding: 0.5rem 0.6rem;
      border-radius: 12px;
      border: 1px solid color-mix(in srgb, var(--color-border, rgba(255,255,255,0.12)) 70%, transparent);
      background: color-mix(in srgb, var(--color-surface, #0f172a) 92%, transparent);
      color: var(--color-text-primary, #e8edf7);
      cursor: pointer;
      transition: background 0.18s ease, border-color 0.18s ease;
    }
    .ghost:hover { background: color-mix(in srgb, var(--color-primary, #E8BE14) 10%, transparent); border-color: color-mix(in srgb, var(--color-primary, #E8BE14) 35%, transparent); }

    .user-profile {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.55rem 0.65rem;
      border-radius: 12px;
      background: color-mix(in srgb, var(--color-surface, #0f172a) 92%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-border, rgba(255,255,255,0.08)) 80%, transparent);
      cursor: pointer;
      transition: background 0.18s ease, border-color 0.18s ease;
    }
    .user-profile:hover { background: color-mix(in srgb, var(--color-primary, #E8BE14) 10%, transparent); border-color: color-mix(in srgb, var(--color-primary, #E8BE14) 40%, transparent); }
    .user-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, var(--color-primary, #E8BE14), color-mix(in srgb, var(--color-primary, #E8BE14) 65%, transparent));
      color: var(--color-text-on-primary, #0c2243);
      font-weight: 800;
      box-shadow: 0 12px 24px rgba(0,0,0,0.3);
    }
    .user-info { display: grid; gap: 0.05rem; }
    .user-name { font-weight: 700; color: var(--color-text-primary, #e8edf7); }
    .user-role { font-size: 0.85rem; color: var(--color-text-secondary, rgba(232,237,247,0.7)); }
    .sidebar.sidebar-collapsed .footer-cta { display: none; }
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
      overflow-y: auto;
      padding-bottom: 1.5rem;
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
        overflow-y: auto;
        padding-bottom: 1.5rem;
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .sidebar.sidebar-collapsed {
        width: min(320px, 85vw);
        padding: 0.9rem;
      }
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
