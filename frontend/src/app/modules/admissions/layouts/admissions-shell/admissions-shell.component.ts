import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

interface AdmissionNavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-admissions-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="admissions-shell">
      <header class="admissions-header">
        <div>
          <p class="eyebrow">Admissions</p>
          <h1 class="title">Admissions Workspace</h1>
          <p class="subtitle">Walk-ins, online applications, prospectus, reports, and settings.</p>
        </div>
        <div class="nav-actions">
          <a
            *ngFor="let item of navItems"
            [routerLink]="item.path"
            routerLinkActive="active"
            class="nav-chip">
            <span class="icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        </div>
      </header>

      <main class="admissions-content">
        <router-outlet />
      </main>
    </section>
  `,
  styles: [`
    .admissions-shell { display:flex; flex-direction:column; gap:1rem; padding:1rem 1.5rem; }
    .admissions-header { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap; }
    .eyebrow { margin:0; text-transform:uppercase; letter-spacing:0.08em; font-size:12px; color:var(--color-text-secondary); }
    .title { margin:0.1rem 0; font-size:22px; }
    .subtitle { margin:0; color:var(--color-text-secondary); }
    .nav-actions { display:flex; gap:0.5rem; flex-wrap:wrap; }
    .nav-chip { display:inline-flex; align-items:center; gap:0.35rem; padding:0.55rem 0.85rem; border-radius:999px; background:var(--surface-2, #1d2333); color:inherit; text-decoration:none; transition:all 0.2s ease; border:1px solid transparent; }
    .nav-chip .icon { font-size:14px; }
    .nav-chip:hover { border-color:var(--primary-400, #4f8bff); box-shadow:0 8px 24px rgba(0,0,0,0.18); transform:translateY(-1px); }
    .nav-chip.active { background:var(--primary-600, #2f6fe2); color:#fff; }
    .admissions-content { background:var(--surface-1, #0f1424); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:1rem 1.25rem; min-height:60vh; }
  `]
})
export class AdmissionsShellComponent {
  navItems: AdmissionNavItem[] = [
    { label: 'Dashboard', path: '/admissions/dashboard', icon: '📊' },
    { label: 'Walk-in', path: '/admissions/walk-in/new', icon: '🚪' },
    { label: 'Online', path: '/admissions/online/applications', icon: '🌐' },
    { label: 'Prospectus', path: '/admissions/prospectus/sell', icon: '🧾' },
    { label: 'Reports', path: '/admissions/reports/daily', icon: '📈' },
    { label: 'Settings', path: '/admissions/settings/rounds', icon: '⚙️' },
  ];
}
