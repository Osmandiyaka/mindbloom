import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'mindbloom_theme';
  
  // Current theme setting
  currentTheme = signal<Theme>(this.getStoredTheme());
  
  // System preference
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Effective theme (resolved from auto)
  effectiveTheme = signal<'light' | 'dark'>(this.resolveTheme(this.getStoredTheme()));

  constructor() {
    // Apply theme on initialization
    this.applyTheme(this.effectiveTheme());
    
    // Watch for theme changes
    effect(() => {
      const theme = this.currentTheme();
      const resolved = this.resolveTheme(theme);
      this.effectiveTheme.set(resolved);
      this.applyTheme(resolved);
      localStorage.setItem(this.STORAGE_KEY, theme);
    });

    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme() === 'auto') {
        const resolved = e.matches ? 'dark' : 'light';
        this.effectiveTheme.set(resolved);
        this.applyTheme(resolved);
      }
    });
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  toggleTheme(): void {
    const current = this.effectiveTheme();
    this.currentTheme.set(current === 'light' ? 'dark' : 'light');
  }

  private getStoredTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme;
    return stored && ['light', 'dark', 'auto'].includes(stored) ? stored : 'light';
  }

  private resolveTheme(theme: Theme): 'light' | 'dark' {
    if (theme === 'auto') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }
    return theme;
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light-theme', 'dark-theme');
    
    // Add new theme class
    root.classList.add(`${theme}-theme`);
    
    // Set data attribute for CSS
    root.setAttribute('data-theme', theme);

    // Apply CSS variables
    if (theme === 'dark') {
      this.applyDarkTheme(root);
    } else {
      this.applyLightTheme(root);
    }
  }

  private applyLightTheme(root: HTMLElement): void {
    root.style.setProperty('--color-primary', '#667eea');
    root.style.setProperty('--color-primary-dark', '#5a67d8');
    root.style.setProperty('--color-primary-light', '#7c8ef0');
    root.style.setProperty('--color-secondary', '#764ba2');
    root.style.setProperty('--color-accent', '#1EA7FF');
    
    root.style.setProperty('--color-background', '#f8f9fb');
    root.style.setProperty('--color-surface', '#ffffff');
    root.style.setProperty('--color-surface-hover', '#f3f6fb');
    
    root.style.setProperty('--color-text-primary', '#1A1E27');
    root.style.setProperty('--color-text-secondary', '#4a5568');
    root.style.setProperty('--color-text-tertiary', '#8B95A5');
    
    root.style.setProperty('--color-border', '#e8edf2');
    root.style.setProperty('--color-border-light', '#f3f6fb');
    
    root.style.setProperty('--color-success', '#10b981');
    root.style.setProperty('--color-warning', '#f59e0b');
    root.style.setProperty('--color-error', '#ef4444');
    root.style.setProperty('--color-info', '#3b82f6');
    
    root.style.setProperty('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.05)');
    root.style.setProperty('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.07)');
    root.style.setProperty('--shadow-lg', '0 10px 15px rgba(0, 0, 0, 0.1)');
  }

  private applyDarkTheme(root: HTMLElement): void {
    root.style.setProperty('--color-primary', '#818cf8');
    root.style.setProperty('--color-primary-dark', '#6366f1');
    root.style.setProperty('--color-primary-light', '#a5b4fc');
    root.style.setProperty('--color-secondary', '#a78bfa');
    root.style.setProperty('--color-accent', '#60a5fa');
    
    root.style.setProperty('--color-background', '#0f172a');
    root.style.setProperty('--color-surface', '#1e293b');
    root.style.setProperty('--color-surface-hover', '#334155');
    
    root.style.setProperty('--color-text-primary', '#f1f5f9');
    root.style.setProperty('--color-text-secondary', '#cbd5e1');
    root.style.setProperty('--color-text-tertiary', '#94a3b8');
    
    root.style.setProperty('--color-border', '#334155');
    root.style.setProperty('--color-border-light', '#475569');
    
    root.style.setProperty('--color-success', '#22c55e');
    root.style.setProperty('--color-warning', '#fbbf24');
    root.style.setProperty('--color-error', '#f87171');
    root.style.setProperty('--color-info', '#60a5fa');
    
    root.style.setProperty('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.3)');
    root.style.setProperty('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.4)');
    root.style.setProperty('--shadow-lg', '0 10px 15px rgba(0, 0, 0, 0.5)');
  }
}
