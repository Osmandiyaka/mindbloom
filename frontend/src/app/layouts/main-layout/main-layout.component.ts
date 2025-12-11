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
      --toolbar-height: 60px;
      --task-sticky-height: 48px;
      --brand-gold: #E5C100;
      --brand-surface-deep: #12141b;
      display: block;
      height: 100%;
    }

    ::selection {
      background: var(--brand-gold);
      color: #000;
      text-shadow: none;
    }

    .app-layout {
      display: grid;
      grid-template-columns: var(--sidebar-width, 260px) minmax(0, 1fr);
      height: 100vh;
      max-height: 100vh;
      overflow: hidden;
      background: var(--content-background, var(--brand-surface-deep));
      transition: grid-template-columns 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
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
      height: 100%;
      min-height: 0;
      min-width: 0;
      overflow: hidden;
      background: radial-gradient(
        circle at 50% 30%,
        rgba(30, 20, 15, 0.4) 0%,
        rgba(12, 8, 6, 0.95) 80%
      );
    }

    app-global-toolbar,
    app-task-sticky {
      flex-shrink: 0;
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(18, 12, 8, 0.85);
      backdrop-filter: blur(16px) saturate(180%);
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }

    app-task-sticky { top: var(--toolbar-height); z-index: 90; }

    .main-content {
      flex: 1;
      min-height: 0;
      min-width: 0;
      overflow-y: auto;
      overflow-x: hidden;
      width: 100%;
      padding: 0;
      background: transparent;
      z-index: 1;
      scroll-behavior: smooth;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.1) transparent;
    }

    .main-content::-webkit-scrollbar { width: 8px; }
    .main-content::-webkit-scrollbar-track { background: transparent; }
    .main-content::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      border: 3px solid transparent;
      background-clip: content-box;
    }
    .main-content::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.2); }

    .main-shell {
      width: 100%;
      max-width: 1600px;
      margin: 0 auto;
      padding-left: clamp(1rem, 2vw, 1.5rem);
      padding-right: clamp(1rem, 2vw, 1.5rem);
      padding-top: 2rem;
      padding-bottom: 5rem;
      min-height: 100%;
      animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 1024px) {
      .app-layout {
        grid-template-columns: minmax(72px, var(--sidebar-width, 260px)) minmax(0, 1fr);
      }

      :host {
        --toolbar-height: 72px;
      }
    }

    @media (max-width: 768px) {
      :host { --toolbar-height: 88px; }
      .main-shell {
        padding-left: 1rem;
        padding-right: 1rem;
        padding-top: 1.5rem;
        padding-bottom: 3rem;
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
