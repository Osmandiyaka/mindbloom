import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { GlobalToolbarComponent } from '../../shared/components/global-toolbar/global-toolbar.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, SidebarComponent, GlobalToolbarComponent],
    template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="content-wrapper">
        <app-global-toolbar />
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
    styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-primary);
    }

    .content-wrapper {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      min-height: 100vh;

      @media (max-width: 768px) {
        margin-left: 0;
      }
    }

    .main-content {
      flex: 1;
      padding: 2rem;

      @media (max-width: 768px) {
        padding: 1rem;
      }
    }
  `]
})
export class MainLayoutComponent { }
