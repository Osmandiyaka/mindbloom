import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, ThemeMode } from '../../../core/services/theme.service';

@Component({
    selector: 'app-theme-switcher',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="theme-switcher">
      <button 
        class="theme-btn"
        [class.active]="effectiveTheme() === 'light'"
        (click)="setTheme('light')"
        title="Light theme"
        [attr.aria-label]="'Switch to light theme'">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      </button>

      <button 
        class="theme-btn"
        [class.active]="effectiveTheme() === 'dark'"
        (click)="setTheme('dark')"
        title="Dark theme"
        [attr.aria-label]="'Switch to dark theme'">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>

      <button 
        class="theme-btn"
        [class.active]="currentTheme() === 'auto'"
        (click)="setTheme('auto')"
        title="Auto theme (system)"
        [attr.aria-label]="'Switch to auto theme'">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </button>
    </div>
  `,
    styles: [`
    .theme-switcher {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e8edf2);
      border-radius: 8px;
    }

    .theme-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: var(--color-text-secondary, #4a5568);
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s ease;
      padding: 0;

      svg {
        width: 18px;
        height: 18px;
      }

      &:hover {
        background: var(--color-surface-hover, #f3f6fb);
        color: var(--color-primary, #667eea);
      }

      &.active {
        background: var(--color-primary, #667eea);
        color: white;

        &:hover {
          background: var(--color-primary-dark, #5a67d8);
        }
      }

      &:active {
        transform: scale(0.95);
      }
    }

    @media (max-width: 768px) {
      .theme-switcher {
        padding: 2px;
        gap: 2px;
      }

      .theme-btn {
        width: 28px;
        height: 28px;

        svg {
          width: 16px;
          height: 16px;
        }
      }
    }
  `]
})
export class ThemeSwitcherComponent {
    currentTheme = this.themeService.currentTheme;
    currentMode = this.themeService.currentMode;

    constructor(private themeService: ThemeService) { }

    effectiveTheme() {
        const theme = this.currentTheme();
        return theme.mode;
    }

    setTheme(theme: ThemeMode | string): void {
        if (theme === 'light' || theme === 'dark' || theme === 'auto') {
            this.themeService.setMode(theme as ThemeMode);
        } else {
            this.themeService.setMode('auto');
        }
    }
}
