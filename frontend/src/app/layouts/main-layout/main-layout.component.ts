import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
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
      [class.mobile]="isMobile"
      [class.collapsed]="!isMobile && sidebarCollapsed"
      [style.--sidebar-width]="isMobile ? 'min(320px, 85vw)' : sidebarCollapsed ? '78px' : '260px'"
    >
      <div
        class="sidebar-shell"
        [class.mobile]="isMobile"
        [class.open]="isMobile && mobileNavOpen"
      >
        <app-sidebar
          id="app-sidebar"
          [sidebarId]="'app-sidebar'"
          [ariaLabel]="'Main navigation'"
          [collapsed]="isMobile ? false : sidebarCollapsed"
          [isMobile]="isMobile"
          [mobileOpen]="mobileNavOpen"
          (navigate)="handleSidebarNavigate()"
        />
      </div>

      <div
        class="sidebar-backdrop"
        *ngIf="isMobile && mobileNavOpen"
        (click)="closeMobileNav()"
        aria-hidden="true"
      ></div>

      <div class="content-wrapper">
        <app-global-toolbar
          [collapsed]="sidebarCollapsed"
          [isMobile]="isMobile"
          [navOpen]="mobileNavOpen"
          (navToggle)="toggleNav()"
        />
        <app-task-sticky />
        <main class="main-content" tabindex="-1">
          <div class="main-shell">
            <div class="breadcrumbs-slot" aria-hidden="true"></div>
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
      transition: grid-template-columns 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
      position: relative;
    }

    @supports (height: 100dvh) {
      .app-layout {
        height: 100dvh;
        max-height: 100dvh;
      }
    }

    .sidebar-shell {
      height: 100%;
      position: relative;
      z-index: 180;
    }

    .sidebar-shell.mobile {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: var(--sidebar-width, min(320px, 85vw));
      max-width: 360px;
      transform: translateX(-100%);
      transition: transform 0.28s ease, opacity 0.2s ease;
      box-shadow: 0 12px 36px rgba(0,0,0,0.4);
      opacity: 0;
      pointer-events: none;
      background: transparent;
    }

    .sidebar-shell.mobile.open {
      transform: translateX(0);
      opacity: 1;
      pointer-events: auto;
    }

    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(2px);
      z-index: 150;
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
      box-sizing: border-box;
    }

    .breadcrumbs-slot {
      min-height: 16px;
      margin-bottom: 0.5rem;
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
      .app-layout {
        grid-template-columns: 1fr;
      }

      .main-shell {
        padding-left: 1rem;
        padding-right: 1rem;
        padding-top: 1.5rem;
        padding-bottom: 3rem;
      }

      .sidebar-shell {
        width: 88vw;
        max-width: 380px;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  sidebarCollapsed = false;
  isMobile = false;
  mobileNavOpen = false;
  private mql?: MediaQueryList;

  ngOnInit(): void {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      this.mql = window.matchMedia('(max-width: 768px)');
      this.handleMediaChange(this.mql);
      this.mql.addEventListener('change', this.handleMediaChange);
    }
  }

  ngOnDestroy(): void {
    if (this.mql) {
      this.mql.removeEventListener('change', this.handleMediaChange);
    }
    this.setBodyScrollLock(false);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isMobile && this.mobileNavOpen) {
      this.closeMobileNav();
    }
  }

  toggleNav(): void {
    if (this.isMobile) {
      this.mobileNavOpen = !this.mobileNavOpen;
      this.setBodyScrollLock(this.mobileNavOpen);
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeMobileNav(): void {
    if (this.isMobile) {
      this.mobileNavOpen = false;
      this.setBodyScrollLock(false);
    }
  }

  handleSidebarNavigate(): void {
    this.closeMobileNav();
  }

  private handleMediaChange = (event: MediaQueryList | MediaQueryListEvent) => {
    this.isMobile = event.matches;
    if (this.isMobile) {
      this.sidebarCollapsed = true;
      this.mobileNavOpen = false;
      this.setBodyScrollLock(false);
    } else {
      this.mobileNavOpen = false;
      this.setBodyScrollLock(false);
    }
  };

  private setBodyScrollLock(lock: boolean): void {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = lock ? 'hidden' : '';
  }
}
