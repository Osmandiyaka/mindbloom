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
                primary: '#8a9ff9',
                primaryDark: '#6f84e0',
                primaryLight: '#b7c4ff',
                secondary: '#c1cffc',
                accent: '#9f8ff7',
                background: '#e9edf5',
                surface: '#f5f7fb',
                surfaceHover: '#eef1f9',
                textPrimary: '#1f2748',
                textSecondary: '#56627a',
                textTertiary: '#8b96b1',
                border: '#d2d9e6',
                borderLight: '#e9eef7',
                success: '#69c3aa',
                warning: '#f3c178',
                error: '#ef8f9c',
                info: '#9db7ff'
            },
            shadows: {
                sm: '4px 4px 8px rgba(163, 177, 198, 0.45), -4px -4px 8px rgba(255, 255, 255, 0.8)',
                md: '10px 10px 20px rgba(163, 177, 198, 0.4), -10px -10px 20px rgba(255, 255, 255, 0.85)',
                lg: '20px 20px 40px rgba(163, 177, 198, 0.35), -20px -20px 40px rgba(255, 255, 255, 0.9)'
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
                primary: '#5b9bd5',
                primaryDark: '#4a8ac4',
                primaryLight: '#7db3e0',
                secondary: '#a259ff',
                accent: '#e74856',
                background: '#1a1d29',
                surface: '#252835',
                surfaceHover: '#2d3142',
                textPrimary: '#e8eaed',
                textSecondary: '#b4b8c5',
                textTertiary: '#8b91a7',
                border: '#3a3f52',
                borderLight: '#464c5e',
                success: '#34c759',
                warning: '#f7ad42',
                error: '#e74856',
                info: '#5b9bd5'
            },
            shadows: {
                sm: '0 1px 3px rgba(0, 0, 0, 0.5)',
                md: '0 4px 8px rgba(0, 0, 0, 0.6)',
                lg: '0 10px 20px rgba(0, 0, 0, 0.7)'
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
