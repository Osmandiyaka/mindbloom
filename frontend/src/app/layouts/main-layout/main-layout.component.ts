import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, SidebarComponent],
    template: `
    <div class="app-layout">
      <app-sidebar />
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
    styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-primary);
    }

    .main-content {
      flex: 1;
      margin-left: 260px;
      padding: 2rem;
      min-height: 100vh;

      @media (max-width: 768px) {
        margin-left: 0;
        padding: 1rem;
      }
    }
  `]
})
export class MainLayoutComponent { }
