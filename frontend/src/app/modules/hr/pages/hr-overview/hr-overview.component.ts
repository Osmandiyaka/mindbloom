import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hr-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">HR</p>
          <h1>People & Departments</h1>
          <p class="sub">Manage staff records, leave, and attendance.</p>
        </div>
        <div class="actions">
          <a routerLink="/hr/staff" class="btn primary">Staff Directory</a>
          <a routerLink="/hr/leave" class="btn ghost">Leave</a>
        </div>
      </header>

      <section class="grid">
        <div class="card">
          <h3>Quick Links</h3>
          <ul class="links">
            <li><a routerLink="/hr/staff">Staff Directory</a></li>
            <li><a routerLink="/hr/leave">Leave Requests</a></li>
          </ul>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .actions { display:flex; gap:0.5rem; }
    .btn { border-radius:10px; padding:0.6rem 1rem; font-weight:600; border:1px solid var(--color-border); background: var(--color-surface-hover); color: var(--color-text-primary); text-decoration:none; }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 10px 24px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .btn.ghost { background: transparent; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap:1rem; }
    .card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-sm); }
    .links { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.5rem; }
    .links a { color: var(--color-primary,#7ab8ff); text-decoration:none; }
  `]
})
export class HrOverviewComponent {}
