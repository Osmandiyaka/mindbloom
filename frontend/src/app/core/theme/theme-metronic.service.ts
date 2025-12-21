import { Injectable, effect, inject, signal } from '@angular/core';
import { ThemeService } from '../services/theme.service';
import { DEFAULT_METRONIC_CONFIG, MetronicConfig } from './metronic-config';

// Wraps the existing ThemeService with Metronic-friendly behaviors (KTApp reinits, config signals).
@Injectable({ providedIn: 'root' })
export class ThemeMetronicService {
  private readonly baseTheme = inject(ThemeService);

  metronicConfig = signal<MetronicConfig>(DEFAULT_METRONIC_CONFIG);

  constructor() {
    // Re-init Metronic whenever theme id changes so components pick up fresh CSS vars.
    effect(() => {
      // Subscribes to base theme signal (reading currentTheme())
      const theme = this.baseTheme.currentTheme();
      document.documentElement.setAttribute('data-theme-id', theme.id);
      this.reinitMetronic();
    });
  }

  setTheme(themeId: string) {
    this.baseTheme.setTheme(themeId);
  }

  setConfig(update: Partial<MetronicConfig>) {
    this.metronicConfig.update(cfg => ({ ...cfg, ...update }));
    this.reinitMetronic();
  }

  private reinitMetronic() {
    if (typeof window !== 'undefined' && (window as any).KTApp?.init) {
      (window as any).KTApp.init();
    }
  }
}
