import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconRegistryService } from '../../services/icon-registry.service';

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
          <span class="nav-icon" [innerHTML]="icon('dashboard')"></span>
          <span>MindBloom</span>
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
      padding: 1rem 1rem 1.25rem;
      background: var(--color-surface, #0f172a);
      border-right: 1px solid var(--color-border, #e1e7ef);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: width 0.25s ease, padding 0.25s ease;
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
      gap: 0.6rem;
      font-weight: 800;
      color: var(--color-text-primary, #0f172a);
      letter-spacing: 0.01em;
      transition: opacity 0.2s ease;
    }
    .sidebar.sidebar-collapsed .sidebar-logo span:last-child {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }
    .sidebar-nav {
      display: grid;
      gap: 0.6rem;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      padding-right: 0.2rem;
    }
    .nav-section {
      display: grid;
      gap: 0.35rem;
    }
    .nav-section-title {
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-secondary, #6b7280);
      padding: 0 0.35rem;
      transition: opacity 0.2s ease;
    }
    .sidebar.sidebar-collapsed .nav-section-title {
      opacity: 0;
      height: 0;
      padding: 0;
    }
    .nav-item a {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.55rem 0.65rem;
      border-radius: 12px;
      color: var(--color-text-primary, #111827);
      text-decoration: none;
      transition: background 0.2s ease, color 0.2s ease;
    }
    .nav-item a:hover { background: var(--color-surface-hover, rgba(0,0,0,0.04)); }
    .nav-item a.active {
      background: color-mix(in srgb, var(--color-primary, #7ab8ff) 18%, var(--color-surface, #fff));
      color: var(--color-primary, #0f172a);
    }
    .sidebar.sidebar-collapsed .nav-item a { justify-content: center; }
    .nav-icon { width: 20px; height: 20px; display: inline-flex; }
    .nav-text { transition: opacity 0.2s ease, transform 0.2s ease; }
    .sidebar.sidebar-collapsed .nav-text {
      opacity: 0;
      transform: translateX(-6px);
      width: 0;
      overflow: hidden;
    }
    .nav-badge {
      margin-left: auto;
      background: color-mix(in srgb, var(--color-info, #38bdf8) 15%, var(--color-surface, #fff));
      color: var(--color-text-primary, #111827);
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .sidebar-footer {
      margin-top: auto;
      padding-top: 0.5rem;
      border-top: 1px solid var(--color-border, #e1e7ef);
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
    .user-profile:hover { background: var(--color-surface-hover, rgba(0,0,0,0.05)); }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: color-mix(in srgb, var(--color-primary, #7ab8ff) 20%, var(--color-surface, #fff));
      color: #0f172a;
      font-weight: 800;
    }
    .user-info { transition: opacity 0.2s ease, width 0.2s ease; }
    .sidebar.sidebar-collapsed .user-info {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }
    .user-name { font-weight: 700; color: var(--color-text-primary, #111827); }
    .user-role { font-size: 0.85rem; color: var(--color-text-secondary, #6b7280); }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  currentUser: any;

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
    private icons: IconRegistryService
  ) { }

  icon(name: string) {
    return this.icons.icon(name);
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
    });
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
