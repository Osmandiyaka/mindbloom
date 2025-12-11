import { Component, Input, OnInit } from '@angular/core';
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
    <aside class="sidebar" [class.sidebar-collapsed]="collapsed">
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-mark">
            <ng-container *ngIf="tenantLogo; else defaultLogo">
              <img [src]="tenantLogo" alt="Tenant logo" class="logo-img" />
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
        <button class="collapse-btn" type="button" (click)="collapsed = !collapsed">
          <span [innerHTML]="icon('menu')"></span>
        </button>
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
              [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }">
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
      --sb-shadow-deep: color-mix(in srgb, var(--color-shadow, rgba(0,0,0,0.32)) 90%, transparent);
      --sb-shadow-highlight: color-mix(in srgb, var(--color-surface, #ffffff) 18%, transparent);
      --sb-surface-strong: color-mix(in srgb, var(--color-surface, #0f172a) 92%, var(--color-surface-hover, #e2e8f0) 8%);
      position: sticky;
      top: 0;
      height: 100vh;
      width: var(--sidebar-width, 270px);
      padding: 0.9rem;
      box-sizing: border-box;
      background: var(--sb-surface-strong);
      background-color: var(--color-surface-glass, color-mix(in srgb, var(--color-surface, #f8fafc) 80%, transparent));
      color: var(--color-text-primary, #0f172a);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow:
        inset -1px 0 0 color-mix(in srgb, var(--color-border, rgba(0,0,0,0.08)) 70%, transparent),
        12px 0 28px var(--sb-shadow-deep);
      transition: width 0.25s ease, padding 0.25s ease;
    }
    .sidebar.sidebar-collapsed { width: 84px; padding: 0.9rem 0.6rem; }

    .sidebar-header { display: flex; align-items: center; justify-content: space-between; gap: 0.65rem; }
    .brand { display: inline-flex; align-items: center; gap: 0.65rem; }
    .brand-mark {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 12px 22px rgba(0,0,0,0.32);
    }
    .logo-img { width: 32px; height: 32px; object-fit: cover; border-radius: 10px; }
    .brand-text { display: flex; flex-direction: column; }
    .brand-name { font-weight: 700; letter-spacing: -0.01em; }
    .brand-sub { font-size: 0.8rem; color: var(--color-text-secondary, rgba(232,237,247,0.75)); }
    .collapse-btn {
      width: 38px; height: 38px;
      border-radius: 12px;
      border: 1px solid color-mix(in srgb, var(--color-border, rgba(255,255,255,0.12)) 70%, transparent);
      background: color-mix(in srgb, var(--color-surface-hover, rgba(255,255,255,0.04)) 80%, transparent);
      color: var(--color-text-primary, #e8edf7);
      display: grid; place-items: center;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    }
    .collapse-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.12); }

    .sidebar-nav { flex: 1; min-height: 0; overflow-y: auto; display: grid; gap: 0.9rem; padding-right: 0.15rem; }
    .nav-section-title { font-size: 0.85rem; color: var(--color-text-secondary, rgba(232,237,247,0.72)); padding: 0 0.3rem; margin: 0 0 0.25rem; letter-spacing: -0.01em; }
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
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.55rem 0.65rem;
      border-radius: 12px;
      color: var(--color-text-primary, #0f172a);
      text-decoration: none;
      position: relative;
      transition: background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
      box-shadow:
        inset 2px 2px 4px color-mix(in srgb, var(--color-shadow, rgba(0,0,0,0.18)) 80%, transparent),
        inset -2px -2px 4px color-mix(in srgb, var(--color-surface, #ffffff) 30%, transparent);
    }
    .nav-link:hover {
      background: color-mix(in srgb, var(--color-primary, #E8BE14) 8%, var(--color-surface, #f8fafc));
      box-shadow:
        inset 3px 3px 6px color-mix(in srgb, var(--color-shadow, rgba(0,0,0,0.22)) 85%, transparent),
        inset -3px -3px 6px color-mix(in srgb, var(--color-surface, #ffffff) 35%, transparent);
    }
    .nav-link.active {
      background: color-mix(in srgb, var(--color-primary, #E8BE14) 16%, var(--color-surface, #f8fafc));
      color: var(--color-text-on-primary, var(--color-text-primary, #0f172a));
      box-shadow:
        inset 5px 5px 10px color-mix(in srgb, var(--color-shadow, rgba(0,0,0,0.26)) 90%, transparent),
        inset -5px -5px 10px color-mix(in srgb, var(--color-surface, #ffffff) 45%, transparent);
    }
    .nav-link.active::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 8px;
      bottom: 8px;
      width: 3px;
      border-radius: 999px;
      background: linear-gradient(180deg, var(--color-primary, #E8BE14), color-mix(in srgb, var(--color-primary, #E8BE14) 60%, transparent));
      box-shadow: 0 0 10px color-mix(in srgb, var(--color-primary, #E8BE14) 70%, transparent);
    }
    .nav-link-icon { width: 20px; height: 20px; color: var(--color-text-secondary, rgba(232,237,247,0.82)); display: inline-flex; }
    .nav-link.active .nav-link-icon { color: var(--color-text-on-primary, var(--color-text-primary, #0f172a)); }
    .nav-link-text { font-weight: 700; letter-spacing: -0.02em; }
    .nav-badge { margin-left: auto; min-width: 28px; text-align: center; background: color-mix(in srgb, var(--color-primary, #E8BE14) 20%, var(--color-surface, #0f172a)); color: var(--color-text-on-primary, #0c2243); padding: 0.2rem 0.45rem; border-radius: 999px; font-weight: 800; }

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
  `]
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
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
        { label: 'Reports', path: '/reports', icon: 'tasks' }
      ]
    },
    {
      title: 'Finance',
      items: [
        { label: 'Accounting', path: '/accounting', icon: 'accounting' },
        { label: 'Fee Management', path: '/accounting/fees', icon: 'tasks' }
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
}
