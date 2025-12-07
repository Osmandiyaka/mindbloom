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
      <!-- Logo/Brand -->
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <ng-container *ngIf="tenantLogo; else defaultLogo">
            <img [src]="tenantLogo" alt="Tenant logo" class="logo-img" />
          </ng-container>
          <ng-template #defaultLogo>
            <span class="nav-icon" [innerHTML]="icon('dashboard')"></span>
          </ng-template>
          <span>{{ tenantName || 'MindBloom' }}</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section" *ngFor="let section of navSections">
          <div class="nav-section-title">{{ section.title }}</div>
          <div class="nav-item" *ngFor="let item of section.items">
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }">
              <span class="nav-icon" [innerHTML]="icon(item.icon)"></span>
              <span class="nav-text">{{ item.label }}</span>
              <span class="nav-badge" *ngIf="item.badge">{{ item.badge }}</span>
            </a>
          </div>
        </div>
      </nav>

      <!-- User Profile -->
      <div class="sidebar-footer">
        <div class="user-profile" (click)="logout()">
          <div class="user-avatar">
            {{ getUserInitials() }}
          </div>
          <div class="user-info">
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
      position: sticky;
      top: 0;
      height: 100vh;
      width: var(--sidebar-width, 260px);
      box-sizing: border-box;
      padding: 0.7rem 0.85rem 0.95rem;
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--color-surface, #ffffff) 94%, var(--color-background, #f7f9fc) 6%) 0%,
        color-mix(in srgb, var(--color-surface, #111827) 88%, var(--color-background, #0b0f1a) 12%) 100%
      );
      border-right: none;
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: inset -2px 0 6px color-mix(in srgb, var(--color-border, rgba(0,0,0,0.35)) 65%, transparent);
    }
    .sidebar.sidebar-collapsed {
      padding: 0.75rem 0.5rem;
    }
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .sidebar-logo {
      display: inline-flex;
      align-items: center;
      gap: 0.7rem;
      font-weight: 700;
      color: var(--color-text-primary, #1f2937);
      letter-spacing: -0.02em;
      transition: opacity 0.2s ease;
    }
    .sidebar-logo .logo-img {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      object-fit: cover;
      box-shadow: 0 8px 16px color-mix(in srgb, rgba(0,0,0,0.22) 80%, var(--color-surface, #ffffff) 20%);
      background: color-mix(in srgb, var(--color-surface-hover, #e5e7eb) 90%, transparent);
    }
    .sidebar.sidebar-collapsed .sidebar-logo span:last-child {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }
    .sidebar-nav {
      display: grid;
      gap: 1.2rem;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      padding-right: 0.2rem;
    }
    .nav-section {
      display: grid;
      gap: 0.3rem;
    }
    .nav-section-title {
      font-size: 0.82rem;
      letter-spacing: -0.01em;
      text-transform: none;
      font-weight: 500;
      color: var(--color-text-secondary, #a0a0a0);
      padding: 0 0.35rem 0.1rem 0.35rem;
      margin-top: 2.2rem;
      margin-bottom: 0.1rem;
      transition: opacity 0.2s ease;
    }
    .nav-section:first-of-type .nav-section-title { margin-top: 0.4rem; }
    .sidebar.sidebar-collapsed .nav-section-title {
      opacity: 0;
      height: 0;
      padding: 0;
    }
    .nav-item a {
      display: inline-flex;
      align-items: center;
      gap: 0.58rem;
      padding: 0.45rem 0.8rem;
      border-radius: 16px;
      color: var(--color-text-primary, #f5f7fb);
      text-decoration: none;
      transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
      position: relative;
      overflow: hidden;
      letter-spacing: -0.2px;
      font-weight: 600;
    }
    .nav-item a::after {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: 16px;
      background: color-mix(in srgb, var(--color-primary, #00c4cc) 12%, transparent);
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 0;
    }
    .nav-item a:hover { background: color-mix(in srgb, var(--color-surface-hover, rgba(0,0,0,0.04)) 80%, transparent); transform: translateX(1px); }
    .nav-item a:hover::after { opacity: 1; }
    .nav-item a.active {
      background: transparent;
      color: var(--color-primary, #00c4cc);
      font-weight: 600;
    }
    .nav-item a.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--color-primary, #00c4cc);
      border-radius: 0 8px 8px 0;
      box-shadow: 0 0 8px rgba(0, 196, 204, 0.5);
      transform-origin: left center;
      animation: accent-pop 0.2s ease-out;
    }
    .nav-item a.active::after {
      opacity: 1;
      background: color-mix(in srgb, var(--color-primary, #00c4cc) 18%, transparent);
    }
    @keyframes accent-pop {
      0% { transform: scaleY(0.4); opacity: 0.6; }
      100% { transform: scaleY(1); opacity: 1; }
    }
    .sidebar.sidebar-collapsed .nav-item a { justify-content: center; }
    .nav-icon { width: 20px; height: 20px; display: inline-flex; color: #e7e9ef; }
    .nav-item a.active .nav-icon { color: var(--color-primary, #00c4cc); }
    .nav-text { transition: opacity 0.2s ease, transform 0.2s ease; font-weight: 600; letter-spacing: -0.2px; }
    .sidebar.sidebar-collapsed .nav-text {
      opacity: 0;
      transform: translateX(-6px);
      width: 0;
      overflow: hidden;
    }
    .nav-badge {
      margin-left: auto;
      background: color-mix(in srgb, var(--color-primary, #00c4cc) 15%, var(--color-surface, #fff));
      color: var(--color-text-primary, #1f2937);
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .sidebar-footer {
      margin-top: auto;
      padding-top: 0.3rem;
      border-top: none;
      background: linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--color-surface-hover, #e5e7eb) 12%, transparent) 100%);
    }
    .user-profile {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.5rem 0.55rem;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .user-profile:hover { background: color-mix(in srgb, var(--color-surface-hover, #e5e7eb) 14%, transparent); }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--color-primary, #00c4cc);
      color: #0b0b0f;
      font-weight: 800;
      box-shadow: 0 10px 18px rgba(0,0,0,0.22);
    }
    .user-info { transition: opacity 0.2s ease, width 0.2s ease; }
    .sidebar.sidebar-collapsed .user-info {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }
    .user-name { font-weight: 700; color: var(--color-text-primary, #e5e7eb); }
    .user-role { font-size: 0.85rem; color: var(--color-text-secondary, #a1a1aa); }
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
      title: 'Academic',
      items: [
        { label: 'Student Workspace', path: '/students', icon: 'dashboard' },
        // Sub-links are available inside the Student Workspace quick links.
      ]
    },
    {
      title: 'HR',
      items: [
        { label: 'Directory', path: '/hr/directory', icon: 'people' },
        { label: 'Leave', path: '/hr/leave', icon: 'calendar' }
      ]
    },
    {
      title: 'Financial',
      items: [
        // { label: 'Fees', path: '/fees', icon: '💰' },
        // { label: 'Invoices', path: '/fees/invoices', icon: '🧾' },
        // { label: 'Fee Plans', path: '/fees/plans', icon: '🗂️' },
        // { label: 'Bulk Invoice', path: '/fees/bulk-invoices', icon: '📥' },
        { label: 'Accounting', path: '/accounting', icon: 'accounting' },
        // { label: 'Finance', path: '/finance', icon: '📈' },
        // { label: 'Payroll', path: '/payroll', icon: '💵' }
      ]
    },
    {
      title: 'Staff & Resources',
      items: [
        { label: 'HR', path: '/hr', icon: 'hr' },
        { label: 'Library', path: '/library', icon: 'library' },
        { label: 'Hostel', path: '/hostel', icon: 'hostel' },
        { label: 'Transport', path: '/transport', icon: 'transport' }
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
}
