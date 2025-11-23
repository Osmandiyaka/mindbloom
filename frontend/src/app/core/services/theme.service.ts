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
            id: 'ocean-light',
            name: 'Ocean Blue',
            mode: 'light',
            colors: {
                primary: '#0ea5e9',
                primaryDark: '#0284c7',
                primaryLight: '#38bdf8',
                secondary: '#06b6d4',
                accent: '#14b8a6',
                background: '#f0f9ff',
                surface: '#ffffff',
                surfaceHover: '#e0f2fe',
                textPrimary: '#0c4a6e',
                textSecondary: '#475569',
                textTertiary: '#94a3b8',
                border: '#bae6fd',
                borderLight: '#e0f2fe',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#3b82f6'
            },
            shadows: {
                sm: '0 1px 2px rgba(14, 165, 233, 0.08)',
                md: '0 4px 6px rgba(14, 165, 233, 0.12)',
                lg: '0 10px 15px rgba(14, 165, 233, 0.15)'
            }
        },
        {
            id: 'forest-light',
            name: 'Forest Green',
            mode: 'light',
            colors: {
                primary: '#16a34a',
                primaryDark: '#15803d',
                primaryLight: '#22c55e',
                secondary: '#84cc16',
                accent: '#10b981',
                background: '#f7fee7',
                surface: '#ffffff',
                surfaceHover: '#ecfccb',
                textPrimary: '#14532d',
                textSecondary: '#475569',
                textTertiary: '#94a3b8',
                border: '#d9f99d',
                borderLight: '#ecfccb',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#3b82f6'
            },
            shadows: {
                sm: '0 1px 2px rgba(22, 163, 74, 0.08)',
                md: '0 4px 6px rgba(22, 163, 74, 0.12)',
                lg: '0 10px 15px rgba(22, 163, 74, 0.15)'
            }
        },
        {
            id: 'sunset-light',
            name: 'Sunset Orange',
            mode: 'light',
            colors: {
                primary: '#f97316',
                primaryDark: '#ea580c',
                primaryLight: '#fb923c',
                secondary: '#dc2626',
                accent: '#f59e0b',
                background: '#fff7ed',
                surface: '#ffffff',
                surfaceHover: '#ffedd5',
                textPrimary: '#7c2d12',
                textSecondary: '#475569',
                textTertiary: '#94a3b8',
                border: '#fed7aa',
                borderLight: '#ffedd5',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#3b82f6'
            },
            shadows: {
                sm: '0 1px 2px rgba(249, 115, 22, 0.08)',
                md: '0 4px 6px rgba(249, 115, 22, 0.12)',
                lg: '0 10px 15px rgba(249, 115, 22, 0.15)'
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
            id: 'midnight-dark',
            name: 'Midnight Blue',
            mode: 'dark',
            colors: {
                primary: '#60a5fa',
                primaryDark: '#3b82f6',
                primaryLight: '#93c5fd',
                secondary: '#818cf8',
                accent: '#38bdf8',
                background: '#020617',
                surface: '#0c1629',
                surfaceHover: '#1e293b',
                textPrimary: '#f8fafc',
                textSecondary: '#cbd5e1',
                textTertiary: '#94a3b8',
                border: '#1e293b',
                borderLight: '#334155',
                success: '#22c55e',
                warning: '#fbbf24',
                error: '#f87171',
                info: '#60a5fa'
            },
            shadows: {
                sm: '0 1px 2px rgba(0, 0, 0, 0.4)',
                md: '0 4px 6px rgba(0, 0, 0, 0.5)',
                lg: '0 10px 15px rgba(0, 0, 0, 0.6)'
            }
        },
        {
            id: 'nature-dark',
            name: 'Nature Dark',
            mode: 'dark',
            colors: {
                primary: '#34d399',
                primaryDark: '#10b981',
                primaryLight: '#6ee7b7',
                secondary: '#4ade80',
                accent: '#22d3ee',
                background: '#0a1612',
                surface: '#1a2e23',
                surfaceHover: '#2d4a3e',
                textPrimary: '#ecfdf5',
                textSecondary: '#a7f3d0',
                textTertiary: '#6ee7b7',
                border: '#2d4a3e',
                borderLight: '#3f6250',
                success: '#22c55e',
                warning: '#fbbf24',
                error: '#f87171',
                info: '#60a5fa'
            },
            shadows: {
                sm: '0 1px 2px rgba(0, 0, 0, 0.4)',
                md: '0 4px 6px rgba(0, 0, 0, 0.5)',
                lg: '0 10px 15px rgba(0, 0, 0, 0.6)'
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

        root.style.setProperty('--shadow-sm', shadows.sm);
        root.style.setProperty('--shadow-md', shadows.md);
        root.style.setProperty('--shadow-lg', shadows.lg);
    }
}
