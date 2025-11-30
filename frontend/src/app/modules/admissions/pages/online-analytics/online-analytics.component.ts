import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-online-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <p class="eyebrow">Admissions · Online</p>
          <h2>Application Analytics</h2>
          <p class="muted">Track volume, status mix, and conversion at a glance.</p>
        </div>
        <div class="filters">
          <label>
            Date range
            <select [(ngModel)]="range">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </label>
          <label>
            Grade
            <select [(ngModel)]="grade">
              <option value="">All</option>
              <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
            </select>
          </label>
        </div>
      </header>

      <div class="cards">
        <div class="card">
          <p class="muted small">Total Applications</p>
          <h3>{{ totals().total }}</h3>
          <div class="muted small">Online vs Walk-in: {{ totals().online }}/{{ totals().walkIn }}</div>
        </div>
        <div class="card">
          <p class="muted small">In Review</p>
          <h3>{{ totals().review }}</h3>
        </div>
        <div class="card">
          <p class="muted small">Enrolled</p>
          <h3>{{ totals().enrolled }}</h3>
        </div>
        <div class="card">
          <p class="muted small">Rejected</p>
          <h3>{{ totals().rejected }}</h3>
        </div>
      </div>

      <div class="charts">
        <div class="panel">
          <div class="panel-header">
            <h4>Status Mix</h4>
            <span class="muted small">By count</span>
          </div>
          <div class="stacked">
            <div class="bar review" [style.width.%]="statusPercents().review">{{ statusPercents().review }}%</div>
            <div class="bar enrolled" [style.width.%]="statusPercents().enrolled">{{ statusPercents().enrolled }}%</div>
            <div class="bar rejected" [style.width.%]="statusPercents().rejected">{{ statusPercents().rejected }}%</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h4>Daily Trend</h4>
            <span class="muted small">{{ rangeLabel() }}</span>
          </div>
          <div class="trend">
            <div class="trend-row" *ngFor="let day of trend()">
              <span class="muted small">{{ day.label }}</span>
              <div class="bar-wrapper">
                <div class="bar review" [style.width.%]="day.reviewPct"></div>
                <div class="bar enrolled" [style.width.%]="day.enrolledPct"></div>
              </div>
              <span class="muted small">{{ day.total }} total</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `.page-shell{padding:1rem 1.5rem; display:flex; flex-direction:column; gap:1rem;}`,
    `.page-header{display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;}`,
    `.eyebrow{text-transform:uppercase; letter-spacing:0.08em; margin:0; font-size:12px; color:var(--color-text-secondary);}`,
    `.muted{margin:0;color:var(--color-text-secondary);}`,
    `.muted.small{font-size:0.9rem;}`,
    `.filters{display:flex; gap:0.5rem; flex-wrap:wrap;}`,
    `.filters select{padding:0.45rem 0.6rem; border-radius:8px; border:1px solid var(--color-border); background:var(--color-surface); color:var(--color-text-primary);}`,
    `.cards{display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:0.75rem;}`,
    `.card{border:1px solid var(--color-border); border-radius:12px; padding:0.85rem 1rem; background:var(--color-surface);}`,
    `.card h3{margin:0.2rem 0;}`,
    `.charts{display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:0.9rem;}`,
    `.panel{border:1px solid var(--color-border); border-radius:12px; padding:0.9rem 1rem; background:var(--color-surface);}`,
    `.panel-header{display:flex; justify-content:space-between; align-items:center;}`,
    `.stacked{display:flex; gap:0.2rem; width:100%; margin-top:0.65rem; height:26px; border-radius:10px; overflow:hidden; background:var(--color-surface-hover);}`,
    `.bar{height:100%; display:flex; align-items:center; justify-content:center; color:var(--color-background, #0f172a); font-weight:700; font-size:0.85rem;}`,
    `.bar.review{background:color-mix(in srgb, var(--color-warning) 85%, transparent);}`,
    `.bar.enrolled{background:color-mix(in srgb, var(--color-success) 90%, transparent);}`,
    `.bar.rejected{background:color-mix(in srgb, var(--color-error) 85%, transparent);}`,
    `.trend{display:flex; flex-direction:column; gap:0.4rem; margin-top:0.65rem;}`,
    `.trend-row{display:grid; grid-template-columns: 1fr 3fr 1fr; align-items:center; gap:0.5rem;}`,
    `.bar-wrapper{display:flex; gap:0.2rem; height:16px;}`,
    `.bar-wrapper .bar{font-size:0;}`,
  ]
})
export class OnlineAnalyticsComponent {
  range = '30d';
  grade = '';
  grades = ['Grade 5', 'Grade 6', 'Grade 7'];

  statusCounts = signal({ review: 12, enrolled: 18, rejected: 5 });
  totals = computed(() => ({
    total: this.statusCounts().review + this.statusCounts().enrolled + this.statusCounts().rejected,
    review: this.statusCounts().review,
    enrolled: this.statusCounts().enrolled,
    rejected: this.statusCounts().rejected,
    online: 22,
    walkIn: 13,
  }));

  statusPercents = computed(() => {
    const tot = Math.max(1, this.totals().total);
    return {
      review: Math.round((this.statusCounts().review / tot) * 100),
      enrolled: Math.round((this.statusCounts().enrolled / tot) * 100),
      rejected: Math.round((this.statusCounts().rejected / tot) * 100),
    };
  });

  trend = signal([
    { label: 'Mon', reviewPct: 40, enrolledPct: 30, total: 25 },
    { label: 'Tue', reviewPct: 35, enrolledPct: 45, total: 28 },
    { label: 'Wed', reviewPct: 25, enrolledPct: 55, total: 30 },
    { label: 'Thu', reviewPct: 30, enrolledPct: 50, total: 22 },
    { label: 'Fri', reviewPct: 20, enrolledPct: 60, total: 26 },
  ]);

  rangeLabel() {
    return this.range === '7d' ? 'Last 7 days' : this.range === '30d' ? 'Last 30 days' : 'Last 90 days';
  }
}
