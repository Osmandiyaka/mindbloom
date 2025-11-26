import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TasksService } from '../../../../core/services/tasks.service';
import { TaskItem } from '../../../../core/models/task.model';

@Component({
  selector: 'app-task-worklist',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tasks-page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Tasks</p>
          <h1>Action Items</h1>
          <p class="sub">Tasks assigned to you or your roles. Click to start or complete.</p>
        </div>
        <div class="stats">
          <div class="stat-card">
            <div class="label">Total</div>
            <div class="value">{{ stats.totals }}</div>
          </div>
          <div class="stat-card">
            <div class="label">Completed</div>
            <div class="value success">{{ stats.completed }}</div>
          </div>
          <div class="stat-card">
            <div class="label">Overdue</div>
            <div class="value danger">{{ stats.overdue }}</div>
          </div>
        </div>
      </header>

      <div class="task-grid">
        <div *ngFor="let task of tasks" class="task-card">
          <div class="top-row">
            <span class="pill priority" [class.high]="task.priority === 'High' || task.priority === 'Urgent'">{{ task.priority }}</span>
            <span class="pill status" [class.completed]="task.status === 'Completed'" [class.danger]="task.status === 'Cancelled' || task.status === 'Expired'">{{ task.status }}</span>
          </div>
          <h3>{{ task.title }}</h3>
          <p class="muted">{{ task.description }}</p>
          <div class="meta">
            <span>{{ task.category || 'General' }}</span>
            <span *ngIf="task.dueDate">Due: {{ task.dueDate | date:'mediumDate' }}</span>
          </div>
          <div class="actions">
            <button class="btn ghost" (click)="start(task)">Start</button>
            <button class="btn primary" (click)="complete(task)">Complete</button>
            <button class="btn ghost danger" (click)="cancel(task)">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tasks-page { padding: 1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; }
    .eyebrow { text-transform: uppercase; letter-spacing:0.08em; color: var(--color-text-tertiary); font-weight:700; margin:0 0 0.25rem; }
    h1 { margin:0 0 0.35rem; color: var(--color-text-primary); }
    .sub { margin:0; color: var(--color-text-secondary); }
    .stats { display:flex; gap:0.75rem; }
    .stat-card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:10px; padding:0.75rem 1rem; box-shadow: var(--shadow-sm); }
    .stat-card .label { color: var(--color-text-secondary); font-size:0.85rem; }
    .stat-card .value { font-weight:700; font-size:1.35rem; color: var(--color-text-primary); }
    .stat-card .value.success { color: var(--color-success,#10b981); }
    .stat-card .value.danger { color: var(--color-error,#ef4444); }
    .task-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap:1rem; }
    .task-card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:12px; padding:1rem; box-shadow: var(--shadow-md); display:flex; flex-direction:column; gap:0.5rem; }
    .top-row { display:flex; justify-content:space-between; align-items:center; }
    .pill { padding:0.25rem 0.6rem; border-radius:10px; font-weight:600; font-size:0.8rem; background: var(--color-surface-hover); color: var(--color-text-secondary); }
    .pill.priority.high { background: rgba(var(--color-error-rgb,239,68,68),0.12); color: var(--color-error,#ef4444); }
    .pill.status.completed { background: rgba(var(--color-success-rgb,16,185,129),0.15); color: var(--color-success,#10b981); }
    h3 { margin:0; color: var(--color-text-primary); }
    .muted { margin:0; color: var(--color-text-secondary); min-height: 2.4em; }
    .meta { display:flex; justify-content:space-between; color: var(--color-text-tertiary); font-size:0.9rem; }
    .actions { display:flex; gap:0.5rem; margin-top:auto; flex-wrap:wrap; }
    .btn { border-radius:10px; border:1px solid var(--color-border); padding:0.55rem 0.9rem; font-weight:600; cursor:pointer; background: var(--color-surface-hover); color: var(--color-text-primary); }
    .btn.primary { background: linear-gradient(135deg, var(--color-primary-light,#9fd0ff), var(--color-primary,#7ab8ff)); color:#0f1320; border:none; box-shadow: 0 8px 18px rgba(var(--color-primary-rgb,123,140,255),0.3); }
    .btn.ghost { background: transparent; }
    .btn.danger { border-color: rgba(var(--color-error-rgb,239,68,68),0.3); color: var(--color-error,#ef4444); }
  `]
})
export class TaskWorklistComponent implements OnInit {
  tasks: TaskItem[] = [];
  stats = { totals: 0, completed: 0, overdue: 0 };
  // TODO: replace with real user context
  private userId = 'demo-user';
  private roles = ['Teacher'];

  constructor(private tasksService: TasksService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.tasksService.getMyActiveTasks(this.userId, this.roles).subscribe(tasks => this.tasks = tasks);
    this.tasksService.stats(this.userId, this.roles).subscribe(stats => this.stats = stats);
  }

  start(task: TaskItem) {
    this.tasksService.start(task.id, this.userId, this.roles).subscribe(() => this.load());
  }

  complete(task: TaskItem) {
    this.tasksService.complete(task.id, this.userId, this.roles).subscribe(() => this.load());
  }

  cancel(task: TaskItem) {
    this.tasksService.cancel(task.id, this.userId).subscribe(() => this.load());
  }
}
