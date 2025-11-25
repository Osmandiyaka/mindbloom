import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeDefinition {
    id: string;
    name: string;
    mode: 'light' | 'dark';
    colors: {
        primary: string;
        primaryDark: string;
        primaryLight: string;
        secondary: string;
        accent: string;
        background: string;
        surface: string;
        surfaceHover: string;
        textPrimary: string;
        textSecondary: string;
        textTertiary: string;
        border: string;
        borderLight: string;
        success: string;
        warning: string;
        error: string;
        info: string;
    };
    shadows: {
        sm: string;
        md: string;
        lg: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly STORAGE_KEY = 'mindbloom_theme';
    private readonly MODE_STORAGE_KEY = 'mindbloom_theme_mode';

    // Available themes
    readonly themes: ThemeDefinition[] = [
        {
            id: 'default-light',
            name: 'Default Light',
            mode: 'light',
            colors: {
                primary: '#667eea',
                primaryDark: '#5a67d8',
                primaryLight: '#7c8ef0',
                secondary: '#764ba2',
                accent: '#1EA7FF',
                background: '#f8f9fb',
                surface: '#ffffff',
                surfaceHover: '#f3f6fb',
                textPrimary: '#1A1E27',
                textSecondary: '#4a5568',
                textTertiary: '#8B95A5',
                border: '#e8edf2',
                borderLight: '#f3f6fb',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#3b82f6'
            },
            shadows: {
                sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
                md: '0 4px 6px rgba(0, 0, 0, 0.07)',
                lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
            }
        },
        {
            id: 'neumorphism-light',
            name: 'Neumorphism',
            mode: 'light',
            colors: {
                primary: '#7b8cff',
                primaryDark: '#5c6bd6',
                primaryLight: '#a8b3ff',
                secondary: '#cfd7ff',
                accent: '#b58cff',
                background: '#e7ecf5',
                surface: '#f7f9fd',
                surfaceHover: '#eef2f9',
                textPrimary: '#1d2340',
                textSecondary: '#55607a',
                textTertiary: '#8b95ad',
                border: '#d5ddeb',
                borderLight: '#ecf1f9',
                success: '#5ec6ad',
                warning: '#f2bf77',
                error: '#f0899c',
                info: '#8fb6ff'
            },
            shadows: {
                sm: '6px 6px 12px rgba(152, 168, 193, 0.35), -6px -6px 12px rgba(255, 255, 255, 0.9)',
                md: '12px 12px 24px rgba(152, 168, 193, 0.32), -12px -12px 24px rgba(255, 255, 255, 0.92)',
                lg: '24px 24px 48px rgba(152, 168, 193, 0.3), -24px -24px 48px rgba(255, 255, 255, 0.94)'
            }
        },
        {
            id: 'default-dark',
            name: 'Default Dark',
            mode: 'dark',
            colors: {
                primary: '#818cf8',
                primaryDark: '#6366f1',
                primaryLight: '#a5b4fc',
                secondary: '#a78bfa',
                accent: '#60a5fa',
                background: '#0f172a',
                surface: '#1e293b',
                surfaceHover: '#334155',
                textPrimary: '#f1f5f9',
                textSecondary: '#cbd5e1',
                textTertiary: '#94a3b8',
                border: '#334155',
                borderLight: '#475569',
                success: '#22c55e',
                warning: '#fbbf24',
                error: '#f87171',
                info: '#60a5fa'
            },
            shadows: {
                sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
                md: '0 4px 6px rgba(0, 0, 0, 0.4)',
                lg: '0 10px 15px rgba(0, 0, 0, 0.5)'
            }
        },
        {
            id: 'aspnet-zero-dark',
            name: 'ASP.NET Zero Dark',
            mode: 'dark',
            colors: {
                primary: '#7ab8ff',
                primaryDark: '#4e8ddb',
                primaryLight: '#9fd0ff',
                secondary: '#8f7cff',
                accent: '#ff7b95',
                background: '#0f1320',
                surface: '#151a29',
                surfaceHover: '#1f2434',
                textPrimary: '#e5e9f5',
                textSecondary: '#b8c0d6',
                textTertiary: '#8d95ad',
                border: '#252c3d',
                borderLight: '#32394c',
                success: '#5bd7a6',
                warning: '#f6c56a',
                error: '#ff6b87',
                info: '#7ab8ff'
            },
            shadows: {
                sm: '0 4px 10px rgba(0, 0, 0, 0.45)',
                md: '0 8px 20px rgba(0, 0, 0, 0.55)',
                lg: '0 16px 32px rgba(0, 0, 0, 0.6)'
            }
        }
    ];

    // Current theme and mode
    currentTheme = signal<ThemeDefinition>(this.getStoredTheme());
    currentMode = signal<ThemeMode>(this.getStoredMode());

    // System preference
    private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    constructor() {
        // Apply theme on initialization
        this.applyTheme(this.currentTheme());

        // Watch for theme changes
        effect(() => {
            const theme = this.currentTheme();
            this.applyTheme(theme);
            localStorage.setItem(this.STORAGE_KEY, theme.id);
        });

        // Watch for mode changes
        effect(() => {
            const mode = this.currentMode();
            localStorage.setItem(this.MODE_STORAGE_KEY, mode);
            if (mode === 'auto') {
                this.applyAutoTheme();
            }
        });

        // Listen for system theme changes
        this.mediaQuery.addEventListener('change', () => {
            if (this.currentMode() === 'auto') {
                this.applyAutoTheme();
            }
        });
    }

    setTheme(themeId: string): void {
        const theme = this.themes.find(t => t.id === themeId);
        if (theme) {
            this.currentTheme.set(theme);
            // Update mode to match theme's mode
            this.currentMode.set(theme.mode);
        }
    }

    setMode(mode: ThemeMode): void {
        this.currentMode.set(mode);
        if (mode === 'auto') {
            this.applyAutoTheme();
        } else {
            // Find a theme matching the mode
            const matchingTheme = this.themes.find(t => t.mode === mode);
            if (matchingTheme) {
                this.currentTheme.set(matchingTheme);
            }
        }
    }

    getThemesByMode(mode: 'light' | 'dark'): ThemeDefinition[] {
        return this.themes.filter(t => t.mode === mode);
    }

    private applyAutoTheme(): void {
        const prefersDark = this.mediaQuery.matches;
        const mode = prefersDark ? 'dark' : 'light';
        const matchingTheme = this.themes.find(t => t.mode === mode && t.id.includes('default'));
        if (matchingTheme) {
            this.currentTheme.set(matchingTheme);
        }
    }

    private getStoredTheme(): ThemeDefinition {
        const storedId = localStorage.getItem(this.STORAGE_KEY);
        const theme = this.themes.find(t => t.id === storedId);
        return theme || this.themes[0]; // Default to first theme
    }

    private getStoredMode(): ThemeMode {
        const stored = localStorage.getItem(this.MODE_STORAGE_KEY) as ThemeMode;
        return stored && ['light', 'dark', 'auto'].includes(stored) ? stored : 'light';
    }

    private applyTheme(theme: ThemeDefinition): void {
        const root = document.documentElement;

        // Remove existing theme classes
        root.classList.remove('light-theme', 'dark-theme');

        // Add new theme class
        root.classList.add(`${theme.mode}-theme`);

        // Set data attributes for CSS
        root.setAttribute('data-theme', theme.mode);
        root.setAttribute('data-theme-id', theme.id);

        // Apply CSS variables
        const { colors, shadows } = theme;

        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-primary-dark', colors.primaryDark);
        root.style.setProperty('--color-primary-light', colors.primaryLight);
        root.style.setProperty('--color-secondary', colors.secondary);
        root.style.setProperty('--color-accent', colors.accent);

        root.style.setProperty('--color-background', colors.background);
        root.style.setProperty('--color-surface', colors.surface);
        root.style.setProperty('--color-surface-hover', colors.surfaceHover);

        root.style.setProperty('--color-text-primary', colors.textPrimary);
        root.style.setProperty('--color-text-secondary', colors.textSecondary);
        root.style.setProperty('--color-text-tertiary', colors.textTertiary);

        root.style.setProperty('--color-border', colors.border);
        root.style.setProperty('--color-border-light', colors.borderLight);

        root.style.setProperty('--color-success', colors.success);
        root.style.setProperty('--color-warning', colors.warning);
        root.style.setProperty('--color-error', colors.error);
        root.style.setProperty('--color-info', colors.info);

        root.style.setProperty('--color-primary-rgb', this.hexToRgb(colors.primary));
        root.style.setProperty('--color-accent-rgb', this.hexToRgb(colors.accent));
        root.style.setProperty('--color-error-rgb', this.hexToRgb(colors.error));
        root.style.setProperty('--color-success-rgb', this.hexToRgb(colors.success));
        root.style.setProperty('--color-warning-rgb', this.hexToRgb(colors.warning));
        root.style.setProperty('--color-info-rgb', this.hexToRgb(colors.info));

        root.style.setProperty('--shadow-sm', shadows.sm);
        root.style.setProperty('--shadow-md', shadows.md);
        root.style.setProperty('--shadow-lg', shadows.lg);
    }

    private hexToRgb(hex: string): string {
        const normalized = hex.replace('#', '');
        const value = normalized.length === 3
            ? normalized.split('').map(char => char + char).join('')
            : normalized;

        const int = parseInt(value, 16);
        const r = (int >> 16) & 255;
        const g = (int >> 8) & 255;
        const b = int & 255;

        return `${r}, ${g}, ${b}`;
    }
}
