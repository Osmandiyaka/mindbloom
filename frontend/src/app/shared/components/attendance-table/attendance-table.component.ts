import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attendance-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="title">Attendance</div>
          <div class="subtitle">Daily status by class</div>
        </div>
      </div>
      <table class="table">
        <thead>
          <tr><th>Student</th><th>Class</th><th>Status</th><th>Updated</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows">
            <td>{{ row.name }}</td>
            <td>{{ row.class }}</td>
            <td>
              <span class="badge" [class.badge-success]="row.status === 'Present'" [class.badge-warning]="row.status === 'Late'" [class.badge-error]="row.status === 'Absent'">{{ row.status }}</span>
            </td>
            <td>{{ row.updated }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .card { background: var(--surface, #fff); border: 1px solid var(--border, #e2e8f0); border-radius: var(--radius-card, 14px); box-shadow: var(--card-shadow, 0 10px 30px rgba(0,0,0,0.06)); overflow: hidden; }
    .card-header { padding: 14px; border-bottom: 1px solid var(--border, #e2e8f0); }
    .title { font-weight: 700; color: var(--text, #0f172a); }
    .subtitle { color: var(--text-muted, #475569); font-size: 13px; }
    table { width: 100%; border-collapse: collapse; color: var(--text, #0f172a); }
    th, td { padding: 10px 12px; text-align: left; }
    th { color: var(--text-muted, #475569); font-weight: 600; font-size: 13px; }
    tr:hover { background: var(--table-row-hover, #eef2f6); }
    .badge { padding: 4px 8px; border-radius: 999px; font-weight: 700; font-size: 12px; color: var(--text, #0f172a); background: var(--surface-elevated, #f1f5f9); border: 1px solid var(--border, #e2e8f0); }
    .badge-success { color: #0f3b18; background: #dcfce7; border-color: #bbf7d0; }
    .badge-warning { color: #78350f; background: #fef3c7; border-color: #fde68a; }
    .badge-error { color: #7f1d1d; background: #fee2e2; border-color: #fecdd3; }
  `]
})
export class AttendanceTableComponent {
  @Input() rows: Array<{ name: string; class: string; status: 'Present' | 'Late' | 'Absent'; updated: string }> = [];
}
