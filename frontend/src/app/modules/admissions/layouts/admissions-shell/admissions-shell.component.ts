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
    .nav-chip { display:inline-flex; align-items:center; gap:0.35rem; padding:0.55rem 0.85rem; border-radius:999px; background:var(--color-surface); color:var(--color-text-primary); text-decoration:none; transition:all 0.2s ease; border:1px solid var(--color-border); box-shadow:var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.18)); }
    .nav-chip .icon { font-size:14px; }
    .nav-chip:hover { border-color:var(--color-primary); box-shadow:var(--shadow-md, 0 8px 24px rgba(0,0,0,0.18)); transform:translateY(-1px); background:var(--color-surface-hover); }
    .nav-chip.active { background:color-mix(in srgb, var(--color-primary) 20%, var(--color-surface) 80%); border-color:var(--color-primary); color:var(--color-text-primary); }
    .admissions-content { background:var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem 1.25rem; min-height:60vh; box-shadow:var(--shadow-md, 0 8px 24px rgba(0,0,0,0.15)); }
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
