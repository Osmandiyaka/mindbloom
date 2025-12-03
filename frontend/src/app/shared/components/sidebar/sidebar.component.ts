import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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
          <span>🎓</span>
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
              <span class="nav-icon">{{ item.icon }}</span>
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
  `
})
export class SidebarComponent implements OnInit {
  collapsed = false;
  currentUser: any;

  navSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: '📊' }
      ]
    },
    {
      title: 'Academic',
      items: [
        { label: 'Students', path: '/students', icon: '👨‍🎓' },
        { label: 'Admissions', path: '/admissions', icon: '📝' },
        { label: 'Academics', path: '/academics', icon: '📚' },
        { label: 'Attendance', path: '/attendance', icon: '✓' }
      ]
    },
    {
      title: 'Financial',
      items: [
        // { label: 'Fees', path: '/fees', icon: '💰' },
        // { label: 'Invoices', path: '/fees/invoices', icon: '🧾' },
        // { label: 'Fee Plans', path: '/fees/plans', icon: '🗂️' },
        // { label: 'Bulk Invoice', path: '/fees/bulk-invoices', icon: '📥' },
        { label: 'Accounting', path: '/accounting', icon: '📒' },
        // { label: 'Finance', path: '/finance', icon: '📈' },
        // { label: 'Payroll', path: '/payroll', icon: '💵' }
      ]
    },
    {
      title: 'Staff & Resources',
      items: [
        { label: 'HR', path: '/hr', icon: '👥' },
        { label: 'Library', path: '/library', icon: '📖' },
        { label: 'Hostel', path: '/hostel', icon: '🏠' },
        { label: 'Transport', path: '/transport', icon: '🚌' }
      ]
    },
    {
      title: 'System',
      items: [
        { label: 'Tenant Settings', path: '/setup/tenant-settings', icon: '⚙️' },
        { label: 'Marketplace', path: '/setup/marketplace', icon: '🛒' },
        { label: 'Plugins', path: '/plugins', icon: '🔌' },
        { label: 'Tasks', path: '/tasks', icon: '✅' }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

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
