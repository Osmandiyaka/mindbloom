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
          <div class="main-shell">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --toolbar-height: clamp(52px, 6vw, 68px);
      display: block;
      height: 100%;
    }

    .app-layout {
      display: grid;
      grid-template-columns: var(--sidebar-width, 260px) minmax(0, 1fr);
      height: 100vh;
      max-height: 100vh;
      overflow: hidden;
      background: var(--content-background, var(--color-background, #12141b));
      transition: grid-template-columns 0.25s ease;
    }

    @supports (height: 100dvh) {
      .app-layout {
        height: 100dvh;
        max-height: 100dvh;
      }
    }

    .content-wrapper {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      min-height: 0;
      min-width: 0;
      overflow: hidden;
      background: linear-gradient(180deg, rgba(18, 12, 8, 0.9), rgba(12, 8, 6, 0.95));
    }

    app-global-toolbar,
    app-task-sticky {
      flex-shrink: 0;
      position: sticky;
      top: 0;
      z-index: 60;
      background: rgba(18, 12, 8, 0.9);
      backdrop-filter: blur(10px);
      box-shadow: 0 6px 14px rgba(0,0,0,0.22);
    }

    app-task-sticky { top: var(--toolbar-height); z-index: 55; }

    .main-content {
      flex: 1;
      min-height: 0;
      min-width: 0;
      overflow-y: auto;
      padding: 0;
      width: 100%;
      background: var(--content-background, var(--color-background, #12141b));
      background-color: var(--content-background, var(--color-background, #12141b));
      z-index: 1;
    }

    .main-shell {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      padding: clamp(1rem, 2vw, 1.5rem) clamp(1rem, 3vw, 2rem);
      padding-top: clamp(0.85rem, 1.5vw, 1.25rem);
    }

    @media (max-width: 1024px) {
      .app-layout {
        grid-template-columns: minmax(72px, var(--sidebar-width, 260px)) minmax(0, 1fr);
      }

      :host {
        --toolbar-height: clamp(68px, 9vw, 96px);
      }
    }

    @media (max-width: 768px) {
      :host { --toolbar-height: clamp(88px, 18vw, 132px); }
    }
  `]
})
export class MainLayoutComponent {
  sidebarCollapsed = false;

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
