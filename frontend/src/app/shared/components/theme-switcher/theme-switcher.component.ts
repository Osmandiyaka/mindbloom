import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { ThemeMetronicService } from '../../../core/theme/theme-metronic.service';

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
    .theme-toggle { padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border, #e2e8f0); background: var(--surface, #fff); color: var(--text, #0f172a); cursor: pointer; }
    .theme-toggle:focus-visible { outline: 2px solid var(--primary, #2b6cb0); outline-offset: 2px; }
    .menu { position: absolute; right: 0; margin-top: 6px; background: var(--surface, #fff); border: 1px solid var(--border, #e2e8f0); border-radius: 12px; box-shadow: var(--card-shadow, 0 10px 30px rgba(0,0,0,0.1)); min-width: 220px; padding: 6px; z-index: 10; }
    .menu button { width: 100%; display: flex; align-items: center; gap: 10px; text-align: left; background: transparent; border: none; padding: 10px 12px; border-radius: 10px; color: var(--text, #0f172a); cursor: pointer; }
    .menu button:hover, .menu button:focus-visible { background: var(--table-row-hover, #eef2f6); outline: none; }
    .dot { width: 12px; height: 12px; border-radius: 999px; border: 1px solid var(--border, #e2e8f0); }
  `]
})
export class ThemeSwitcherComponent {
    private readonly themes = inject(ThemeMetronicService);
    private readonly base = inject(ThemeService);

    options: Array<{ id: 'enterprise-blue' | 'education-green' | 'dark-admin'; label: string; swatch: string }> = [
      { id: 'enterprise-blue', label: 'Enterprise Blue', swatch: '#2b6cb0' },
      { id: 'education-green', label: 'Education Green', swatch: '#1e9d6f' },
      { id: 'dark-admin', label: 'Dark Admin', swatch: '#66b1ff' },
    ];

    open = signal(false);
    activeThemeLabel = computed(() => {
        const id = this.base.currentTheme().id;
        return this.options.find(o => o.id === id)?.label ?? this.base.currentTheme().name;
    });

    toggle() { this.open.update(v => !v); }

    pick(id: 'enterprise-blue' | 'education-green' | 'dark-admin') {
        this.themes.setTheme(id);
        this.open.set(false);
    }

    getDot(id: string) {
        return this.options.find(o => o.id === id)?.swatch || '#2b6cb0';
    }
}
