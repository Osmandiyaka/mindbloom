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


    // Available themes (EduHub only)
    readonly themes: ThemeDefinition[] = [
        {
            id: 'eduhub-light',
            name: 'EduHub Light',
            mode: 'light',
            colors: {
                primary: '#3b9eed',
                primaryDark: '#2d7fd0',
                primaryLight: '#c5e3fa',
                secondary: '#f4bb40',
                accent: '#41b2e8',
                background: '#f9fafb',
                surface: '#ffffff',
                surfaceHover: '#f3f4f6',
                textPrimary: '#111827',
                textSecondary: '#4b5563',
                textTertiary: '#6b7280',
                border: '#e5e7eb',
                borderLight: '#f3f4f6',
                success: '#32bc6d',
                warning: '#ffc331',
                error: '#f05252',
                info: '#41b2e8'
            },
            shadows: {
                sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)'
            }
        },
        {
            id: 'eduhub-dark',
            name: 'EduHub Dark',
            mode: 'dark',
            colors: {
                primary: '#59adf0',
                primaryDark: '#3b9eed',
                primaryLight: '#1a52a4',
                secondary: '#f6c55d',
                accent: '#5dbeeb',
                background: '#030712',
                surface: '#111827',
                surfaceHover: '#1f2937',
                textPrimary: '#f9fafb',
                textSecondary: '#d1d5db',
                textTertiary: '#9ca3af',
                border: '#374151',
                borderLight: '#4b5563',
                success: '#51c683',
                warning: '#ffcc50',
                error: '#f26c6c',
                info: '#5dbeeb'
            },
            shadows: {
                sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
                md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
                lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
            }
        },
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

        // 2. Fallback to the first theme for that mode
        const matchingTheme = this.themes.find(t => t.mode === mode);
        if (matchingTheme) {
            this.currentTheme.set(matchingTheme);
            return;
        }

        // 3. Final fallback to the first available theme
        if (this.themes.length > 0) {
            this.currentTheme.set(this.themes[0]);
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

        // Text tokens (also mirrored to legacy names used by shared components)
        root.style.setProperty('--color-text-primary', colors.textPrimary);
        root.style.setProperty('--color-text-secondary', colors.textSecondary);
        root.style.setProperty('--color-text-tertiary', colors.textTertiary);
        root.style.setProperty('--text-primary', colors.textPrimary);
        root.style.setProperty('--text-secondary', colors.textSecondary);
        root.style.setProperty('--text-tertiary', colors.textTertiary);

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
        root.style.setProperty('--btn-border', colors.textPrimary);
        root.style.setProperty('--btn-text', colors.textPrimary);
        root.style.setProperty('--btn-ghost-border', colors.textPrimary);
        root.style.setProperty('--btn-ghost-text', colors.textPrimary);
        root.style.setProperty('--btn-danger-border', colors.error);
        root.style.setProperty('--btn-danger-text', colors.error);

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
        root.style.setProperty('--host-muted-color', colors.textSecondary);

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
        root.style.setProperty('--focus-ring-color', primaryRgb ? `rgba(${primaryRgb}, 0.22)` : 'rgba(102,126,234,0.22)');

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