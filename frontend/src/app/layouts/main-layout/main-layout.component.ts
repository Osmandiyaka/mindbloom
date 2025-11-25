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
      background: var(--content-background, var(--color-background, #12141b));
    }

    .content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      width: calc(100% - 260px);

      @media (max-width: 768px) {
        width: 100%;
      }
    }

    .main-content {
      flex: 1;
      padding: 2rem;
      padding-top: calc(56px + 2rem);
      overflow-y: auto;
      background: var(--content-background, var(--color-background, #12141b));
      background-color: var(--content-background, var(--color-background, #12141b));

      @media (max-width: 768px) {
        padding: 1rem;
        padding-top: calc(52px + 1rem);
      }
    }
  `]
})
export class MainLayoutComponent { }
