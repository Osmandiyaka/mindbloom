import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TasksService } from '../../../core/services/tasks.service';
import { TaskItem } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-sticky',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="sticky-stack" *ngIf="tasks().length">
      <div class="note" *ngFor="let task of tasks(); let i = index"
           [class.collapsed]="isCollapsed(i)"
           [style.transform]="getTilt(i)"
           (mouseenter)="hoverIndex = i"
           (mouseleave)="hoverIndex = null">
        <header>
          <span class="pin" (click)="togglePin(i, $event)">📌</span>
          <span class="priority" [class.high]="task.priority === 'High' || task.priority === 'Urgent'">{{ task.priority }}</span>
          <span class="status">{{ task.status }}</span>
        </header>
        <ng-container *ngIf="isCollapsed(i) && task.dueDate; else expanded">
          <div class="date-block">
            <div class="month">{{ task.dueDate | date:'MMM' }}</div>
            <div class="day">{{ task.dueDate | date:'d' }}</div>
          </div>
        </ng-container>
        <ng-template #expanded>
          <h4>{{ task.title }}</h4>
          <p>{{ task.description || 'No description' }}</p>
          <div class="meta">
            <span>{{ task.category || 'General' }}</span>
            <span *ngIf="task.dueDate">Due {{ task.dueDate | date:'MMM d' }}</span>
          </div>
          <div class="action">
            <a (click)="open(task, $event)">Open</a>
          </div>
        </ng-template>
      </div>
    </section>
  `,
  styles: [`
    .sticky-stack {
      position: fixed;
      top: 88px;
      right: 24px;
      display: grid;
      gap: 0.75rem;
      z-index: 1200;
      width: auto;
      justify-items: end;
    }
    .note {
      background: linear-gradient(180deg, #ffd447 0%, #ffc107 100%);
      color: #1f1f1f;
      border-radius: 10px;
      padding: 0.85rem 0.9rem;
      box-shadow: 0 10px 28px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.3);
      border: 1px solid rgba(0,0,0,0.08);
      transform-origin: center;
      width: fit-content;
      max-width: 220px;
      max-height: 260px;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .note.collapsed {
      max-height: 52px;
      cursor: pointer;
      padding: 0.35rem 0.4rem;
    }
    .note.collapsed header,
    .note.collapsed h4,
    .note.collapsed p,
    .note.collapsed .meta {
      display: none;
    }
    header { display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; margin-bottom:0.35rem; gap:0.3rem; }
    .pin { opacity:0.7; }
    .priority { font-weight:700; color:#b85c00; }
    .priority.high { color:#b71c1c; }
    .status { font-weight:600; color:#3f3f3f; }
    h4 { margin:0 0 0.25rem; font-size:1rem; font-weight:700; color:#222; }
    p { margin:0 0 0.35rem; font-size:0.9rem; color:#333; }
    .meta { display:flex; justify-content:space-between; font-size:0.8rem; color:#414141; font-weight:600; }
    .date-block { text-align:center; padding:2px; line-height:1.05; }
    .month { font-size:0.95rem; font-weight:800; letter-spacing:0.06em; }
    .day { font-size:1.45rem; font-weight:800; line-height:1.1; }
    .action { margin-top:0.3rem; text-align:right; }
    .action a { font-weight:700; color:#b85c00; cursor:pointer; text-decoration:none; }
    .action a:hover { text-decoration:underline; }
  `]
})
export class TaskStickyComponent implements OnInit {
  tasks = signal<TaskItem[]>([]);
  pinnedIndex: number | null = null;
  hoverIndex: number | null = null;
  // TODO: replace with real user context
  private userId = 'demo-user';
  private roles = ['Teacher'];

  constructor(private tasksService: TasksService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.tasksService.getMyActiveTasks(this.userId, this.roles).subscribe(list => {
      this.tasks.set((list || []).slice(0, 5));
    });
  }

  getTilt(index: number) {
    const tilts = ['rotate(-2deg)', 'rotate(2deg)', 'rotate(-1deg)', 'rotate(3deg)', 'rotate(-3deg)'];
    return tilts[index % tilts.length];
  }

  isCollapsed(index: number) {
    if (this.pinnedIndex !== null) {
      return this.pinnedIndex !== index;
    }
    return this.hoverIndex !== index;
  }

  togglePin(index: number, event: MouseEvent) {
    event.stopPropagation();
    this.pinnedIndex = this.pinnedIndex === index ? null : index;
  }

  open(task: TaskItem, event: MouseEvent) {
    event.stopPropagation();
    const queryParams = { ...(task.navigationParams || {}), taskId: task.id };
    this.router.navigate([task.navigationRoute || '/tasks'], { queryParams });
  }
}
