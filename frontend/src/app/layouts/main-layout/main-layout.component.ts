import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { GlobalToolbarComponent } from '../../shared/components/global-toolbar/global-toolbar.component';
import { TaskStickyComponent } from '../../shared/components/task-sticky/task-sticky.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, GlobalToolbarComponent, TaskStickyComponent],
  template: `
    <div
      class="app-layout"
      [class.collapsed]="sidebarCollapsed"
      [style.--sidebar-width]="sidebarCollapsed ? '78px' : '260px'"
    >
      <app-sidebar [collapsed]="sidebarCollapsed" />
      <div class="content-wrapper">
        <app-global-toolbar
          [collapsed]="sidebarCollapsed"
          (sidebarToggle)="toggleSidebar()"
        />
        <app-task-sticky />
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: grid;
      grid-template-columns: var(--sidebar-width, 260px) 1fr;
      min-height: 100vh;
      background: var(--content-background, var(--color-background, #12141b));
      transition: grid-template-columns 0.25s ease;
    }

    .content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      padding: 1.5rem;
      padding-top: calc(56px + 1.5rem);
      overflow-y: auto;
      background: var(--content-background, var(--color-background, #12141b));
      background-color: var(--content-background, var(--color-background, #12141b));

      @media (max-width: 768px) {
        padding: 1rem;
        padding-top: calc(56px + 1rem);
      }
    }
  `]
})
export class MainLayoutComponent {
  sidebarCollapsed = false;

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
