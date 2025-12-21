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
            id: 'retro-light',
            name: 'Retro Light',
            mode: 'light',
            colors: {
                primary: '#E8BE14',
                primaryDark: '#BF9532',
                primaryLight: '#F5DF68',
                secondary: '#CD8223',
                accent: '#5EB5D7',
                background: 'linear-gradient(to bottom right, #FFF1E3 0%, #24180E 50%, #FFF1E3 100%)',
                surface: '#D0C5B9',
                surfaceHover: '#D9D0C7',
                textPrimary: '#4E351A',
                textSecondary: '#604929',
                textTertiary: '#8C6D5E',
                border: '#928576',
                borderLight: '#AB9F95',
                success: '#334F2D',
                warning: '#884B39',
                error: '#813626',
                info: '#5EB5D7'
            },
            shadows: {
                sm: '2px 2px 4px rgba(0,0,0,0.2), -2px -2px 4px rgba(255,255,255,0.7)',
                md: '4px 4px 8px rgba(0,0,0,0.2), -4px -4px 8px rgba(255,255,255,0.6)',
                lg: '8px 8px 16px rgba(0,0,0,0.2), -8px -8px 16px rgba(255,255,255,0.5)'
            }
        },
        // Retro Dark (Brown and Gradient focused) - FINAL REFINEMENT
        {
            id: 'retro-dark',
            name: 'Retro Noir',
            mode: 'dark',
            colors: {
                primary: '#E6B422',
                primaryDark: '#B98E17',
                primaryLight: '#FFD95A',
                secondary: '#CD7A2E',
                accent: '#54D6E8', // Bright cyan accent for contrast and CTAs
                background: 'linear-gradient(135deg, #0F0A07 0%, #3B2214 60%, #0F0A07 100%)',
                surface: '#2F2218', // Warm, polished surface
                surfaceHover: '#3C2A20',
                textPrimary: '#FFF8E6', // Warm near-white for elegance
                textSecondary: '#E2D6C3',
                textTertiary: '#BFAF9B',
                border: '#6B5546',
                borderLight: '#4A372B',
                success: '#5FB075',
                warning: '#F0A500',
                error: '#E74C3C',
                info: '#54D6E8'
            },
            shadows: {
                sm: '0 6px 18px rgba(0,0,0,0.72), inset 0 -1px 0 rgba(255,255,255,0.02)',
                md: '0 10px 30px rgba(0,0,0,0.76), inset 0 -2px 0 rgba(255,255,255,0.02)',
                lg: '0 20px 48px rgba(0,0,0,0.82)'
            }
        },
        // Charcoal Dark (Clean, Wow-level, Modern Dark Mode)
        {
            id: 'charcoal-dark',
            name: 'Charcoal Dark',
            mode: 'dark',
            colors: {
                // Primary color kept but brighter for contrast on dark background
                primary: '#FFC72C', // Bright Amber/Gold
                primaryDark: '#D4A01A',
                primaryLight: '#FFD75E',

                // Secondary shifted from brown to a muted, cooler tone
                secondary: '#B76E79',
                accent: '#5EB5D7',

                // Background and Surfaces are now deep, neutral charcoal/slate grays
                background: '#1A1C20', // Deep Charcoal (Uniform, no distracting gradient)
                surface: '#25282E', // Lighter Charcoal for clean elevation and content blocks
                surfaceHover: '#333740',

                // Text colors adjusted for better readability and less glare
                textPrimary: '#F4F5F7', // Clean near-white
                textSecondary: '#AAB0BD', // Desaturated gray
                textTertiary: '#7C8290',

                // Borders are now subtle lines of slightly lighter gray
                border: '#3F444E',
                borderLight: '#535967',

                // Status colors are strong for instant feedback (crucial for attendance module)
                success: '#5FB075', // Clean, strong green
                warning: '#F0A500', // Strong orange/yellow
                error: '#E55353', // Clear, unambiguous red
                info: '#5EB5D7'
            },
            shadows: {
                // Using standard, subtle dark mode shadows for clear layering
                sm: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.7)',
                md: '0 4px 6px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.8)',
                lg: '0 10px 15px rgba(0, 0, 0, 0.6), 0 4px 6px rgba(0, 0, 0, 0.9)'
            }
        },
        // NEW: Slate Dark (Modern, Premium, High-Contrast UX)
        {
            id: 'slate-dark',
            name: 'Slate Dark (Premium)',
            mode: 'dark',
            colors: {
                primary: '#06B6D4', // Cyan
                primaryDark: '#0E7490',
                primaryLight: '#22D3EE',
                secondary: '#94A3B8', // Slate Gray
                accent: '#3B82F6', // Blue Accent
                background: '#1E293B', // Deep Slate Background
                surface: '#334155', // Lighter Slate Surface
                surfaceHover: '#475569',
                textPrimary: '#F8FAFC', // Pure White Text
                textSecondary: '#CBD5E1',
                textTertiary: '#94A3B8',
                border: '#475569',
                borderLight: '#64748B',
                success: '#4ADE80',
                warning: '#FBBF24',
                error: '#F87171',
                info: '#3B82F6'
            },
            shadows: {
                sm: '0 1px 3px rgba(0, 0, 0, 0.5)',
                md: '0 4px 6px rgba(0, 0, 0, 0.6)',
                lg: '0 10px 15px rgba(0, 0, 0, 0.7)'
            }
        },
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

    /**
     * @returns An array of theme options structured for a selection UI.
     */
    getThemesForUI(): { light: ThemeDefinition[], dark: ThemeDefinition[] } {
        const light = this.themes.filter(t => t.mode === 'light');
        const dark = this.themes.filter(t => t.mode === 'dark');
        return { light, dark };
    }

    /**
     * @returns An array of available mode options for a selection UI.
     */
    getThemeModeOptions(): { id: ThemeMode, name: string }[] {
        return [
            { id: 'light', name: 'Light' },
            { id: 'dark', name: 'Dark' },
            { id: 'auto', name: 'System Default' },
        ];
    }

    getThemesByMode(mode: 'light' | 'dark'): ThemeDefinition[] {
        return this.themes.filter(t => t.mode === mode);
    }

    private applyAutoTheme(): void {
        const prefersDark = this.mediaQuery.matches;
        const mode = prefersDark ? 'dark' : 'light';

        // 1. Try to maintain the user's last manually selected theme for the current mode
        const lastThemeId = localStorage.getItem(this.STORAGE_KEY);
        const lastTheme = this.themes.find(t => t.id === lastThemeId && t.mode === mode);

        if (lastTheme) {
            this.currentTheme.set(lastTheme);
            return;
        }

        // 2. Fallback to the default theme for that mode
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

        // Button token aliases (allow finer control in CSS if needed)
        root.style.setProperty('--btn-primary-bg', colors.primary);
        root.style.setProperty('--btn-primary-border', colors.primaryDark || colors.primary);
        // Ensure a readable text color for primary buttons
        root.style.setProperty('--btn-primary-text', this.getContrastText(colors.primary));

        root.style.setProperty('--shadow-sm', shadows.sm);
        root.style.setProperty('--shadow-md', shadows.md);
        root.style.setProperty('--shadow-lg', shadows.lg);

        // Host-specific variables (used by host/admin pages like Tenants)
        // Provide sensible defaults derived from the active theme so host pages get a polished, cohesive look
        const borderRgb = colors.border && colors.border.startsWith('#') ? this.hexToRgb(colors.border) : null;

        // Ensure text on surfaces is high contrast. Use CSS color-mix expressions where appropriate so
        // designers can tweak values in CSS too. For muted, mix the text color into the surface to get
        // a readable but subdued label color.
        root.style.setProperty('--host-heading-color', colors.textPrimary);
        root.style.setProperty('--host-text-color', colors.textPrimary);
        root.style.setProperty('--host-muted-color', `color-mix(in srgb, var(--color-text-primary) 68%, var(--color-surface) 32%)`);

        // Borders: slightly more visible on dark themes for clarity
        const borderAlpha = theme.mode === 'dark' ? 0.12 : 0.08;
        root.style.setProperty('--host-border-subtle', borderRgb ? `rgba(${borderRgb}, ${borderAlpha})` : (colors.border || `rgba(255,255,255,${borderAlpha})`));

        // Surface variants tuned for depth and separation
        root.style.setProperty('--host-surface-elevated', `color-mix(in srgb, var(--color-surface) 94%, var(--color-background) 6%)`);
        root.style.setProperty('--host-surface-muted', `color-mix(in srgb, var(--color-surface-hover) 86%, var(--color-surface) 14%)`);

        root.style.setProperty('--host-shadow', shadows.md);
        root.style.setProperty('--host-accent', colors.accent);

        // Host tab tokens (provide dedicated tokens for tab text, hover bg and accent contrast)
        // These ensure all tab-like UI can be themed consistently and remain accessible.
        root.style.setProperty('--host-tab-text', `color-mix(in srgb, var(--color-text-secondary) 72%, var(--color-surface) 28%)`);
        root.style.setProperty('--host-tab-bg-hover', `color-mix(in srgb, var(--host-surface-muted) 80%, transparent 20%)`);
        // Ensure readable text color on accent backgrounds (used by active tabs / pills)
        root.style.setProperty('--host-accent-text', this.getContrastText(colors.accent));

        // CTA glow and contrast: compute a readable CTA text color and use a softer glow for dark themes
        const primaryRgb = colors.primary && colors.primary.startsWith('#') ? this.hexToRgb(colors.primary) : null;
        const primaryText = this.getContrastText(colors.primary);
        root.style.setProperty('--btn-primary-text', primaryText);

        if (theme.mode === 'dark') {
            root.style.setProperty('--host-primary-glow', primaryRgb ? `0 6px 18px rgba(${primaryRgb}, 0.16)` : `0 6px 18px rgba(255,255,255,0.06)`);
        } else {
            root.style.setProperty('--host-primary-glow', '0 6px 18px rgba(102,126,234,0.08)');
        }
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

    // Compute relative luminance (WCAG) for a hex color and return contrast-friendly text color
    private relativeLuminance(hex: string): number {
        const normalized = hex.replace('#', '');
        const value = normalized.length === 3
            ? normalized.split('').map(char => char + char).join('')
            : normalized;
        const int = parseInt(value, 16);
        const r = (int >> 16) & 255;
        const g = (int >> 8) & 255;
        const b = int & 255;

        const srgb = [r, g, b].map(c => {
            const v = c / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    }

    private contrastRatio(hexA: string, hexB: string): number {
        const l1 = this.relativeLuminance(hexA);
        const l2 = this.relativeLuminance(hexB);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    private getContrastText(hex: string): string {
        try {
            // Compare contrast against white and dark body text and pick the better
            const contrastWithWhite = this.contrastRatio(hex, '#ffffff');
            const contrastWithDark = this.contrastRatio(hex, '#0b1220');
            // Prefer the higher contrast. If both are low, prefer white for dark themes.
            return contrastWithWhite >= contrastWithDark ? '#ffffff' : '#0b1220';
        } catch {
            return '#ffffff';
        }
    }
}