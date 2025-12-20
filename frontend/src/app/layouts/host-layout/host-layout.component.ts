import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { GlobalToolbarComponent } from '../../shared/components/global-toolbar/global-toolbar.component';

@Component({
    selector: 'app-host-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, SidebarComponent, GlobalToolbarComponent],
    template: `
    <div class="host-layout" [class.mobile]="isMobile"
         [style.--host-nav-width]="isMobile ? 'min(320px, 85vw)' : hostNavCollapsed ? '88px' : '320px'">

      <div class="sidebar-shell" [class.mobile]="isMobile" [class.open]="isMobile && mobileNavOpen">
        <app-sidebar
          id="host-nav"
          [sidebarId]="'host-nav'"
          [ariaLabel]="'Host navigation'"
          [collapsed]="isMobile ? false : hostNavCollapsed"
          [isMobile]="isMobile"
          [mobileOpen]="mobileNavOpen"
          (navigate)="closeMobileNav()"
        />
      </div>

      <div class="sidebar-backdrop" *ngIf="isMobile && mobileNavOpen" (click)="closeMobileNav()" aria-hidden="true"></div>

      <div class="content-wrapper">
        <app-global-toolbar
          [collapsed]="hostNavCollapsed"
          [isMobile]="isMobile"
          [navOpen]="mobileNavOpen"
          (navToggle)="toggleNav()"
        ></app-global-toolbar>

        <main class="main-content" tabindex="-1">
          <div class="main-shell">
            <router-outlet />
          </div>
        </main>
      </div>

    </div>
  `,
    styleUrls: ['./host-layout.component.scss']
})
export class HostLayoutComponent implements OnInit, OnDestroy {
    hostNavCollapsed = false;
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
        if (this.mql) this.mql.removeEventListener('change', this.handleMediaChange);
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
            this.hostNavCollapsed = !this.hostNavCollapsed;
        }
    }

    closeMobileNav(): void {
        if (this.isMobile) {
            this.mobileNavOpen = false;
            this.setBodyScrollLock(false);
        }
    }

    private handleMediaChange = (event: MediaQueryList | MediaQueryListEvent) => {
        this.isMobile = event.matches;
        if (this.isMobile) {
            this.hostNavCollapsed = true;
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
