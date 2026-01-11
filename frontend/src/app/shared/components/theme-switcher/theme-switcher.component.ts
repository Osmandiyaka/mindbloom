import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MbThemeService } from '@mindbloom/ui';

@Component({
    selector: 'app-theme-switcher',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="theme-switcher" [attr.aria-expanded]="open()" (keyup.escape)="open.set(false)">
      <button type="button" class="theme-toggle" (click)="toggle()" aria-haspopup="menu">
        Theme: {{ activeThemeLabel() }}
      </button>
      <div class="menu" *ngIf="open()" role="menu">
        <button role="menuitem" *ngFor="let opt of options" (click)="pick(opt.id)">
          <span class="dot" [style.background]=getDot(opt.id)></span>
          <span>{{ opt.label }}</span>
        </button>
      </div>
    </div>
  `,
    styles: [`
    .theme-switcher { position: relative; display: inline-block; }
    .theme-toggle { padding: 8px 12px; border-radius: 10px; border: 1px solid var(--mb-color-border); background: var(--mb-color-surface); color: var(--mb-color-text); cursor: pointer; }
    .theme-toggle:focus-visible { outline: 2px solid var(--mb-color-focus); outline-offset: 2px; }
    .menu { position: absolute; right: 0; margin-top: 6px; background: var(--mb-color-surface); border: 1px solid var(--mb-color-border); border-radius: 12px; box-shadow: var(--mb-shadow-2); min-width: 220px; padding: 6px; z-index: 10; }
    .menu button { width: 100%; display: flex; align-items: center; gap: 10px; text-align: left; background: transparent; border: none; padding: 10px 12px; border-radius: 10px; color: var(--mb-color-text); cursor: pointer; }
    .menu button:hover, .menu button:focus-visible { background: var(--mb-color-surface-2); outline: none; }
    .dot { width: 12px; height: 12px; border-radius: 999px; border: 1px solid var(--mb-color-border); }
  `]
})
export class ThemeSwitcherComponent {
    private readonly theme = inject(MbThemeService);

    options: Array<{ id: 'light' | 'dark' | 'auto'; label: string; swatch: string }> = [
      { id: 'light', label: 'Light', swatch: '#1f6f63' },
      { id: 'dark', label: 'Dark', swatch: '#4fa39a' },
      { id: 'auto', label: 'Auto', swatch: '#94a3b8' },
    ];

    open = signal(false);
    activeThemeLabel = computed(() => {
        const mode = this.theme.mode();
        if (mode === 'auto') {
            return 'Auto';
        }
        return this.theme.currentTheme().name;
    });

    toggle() { this.open.update(v => !v); }

    pick(id: 'light' | 'dark' | 'auto') {
        this.theme.setMode(id);
        this.open.set(false);
    }

    getDot(id: string) {
        return this.options.find(o => o.id === id)?.swatch || '#2b6cb0';
    }
}
