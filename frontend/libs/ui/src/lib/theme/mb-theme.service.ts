import { Injectable, signal, effect } from '@angular/core';
import { MbDensityMode, MbTenantBranding, MbThemeDefinition, MbThemeMode } from './mb-theme.types';

@Injectable({ providedIn: 'root' })
export class MbThemeService {
    private readonly THEME_KEY = 'mindbloom_theme_mode';
    private readonly DENSITY_KEY = 'mindbloom_density_mode';
    private readonly TENANT_KEY = 'mindbloom_tenant_branding';

    readonly themes: MbThemeDefinition[] = [
        { id: 'mindbloom-light', name: 'MindBloom Light', mode: 'light' },
        { id: 'mindbloom-dark', name: 'MindBloom Dark', mode: 'dark' }
    ];

    readonly mode = signal<MbThemeMode>(this.getStoredMode());
    readonly density = signal<MbDensityMode>(this.getStoredDensity());
    readonly currentTheme = signal<MbThemeDefinition>(this.getStoredTheme());
    readonly tenant = signal<MbTenantBranding | undefined>(this.getStoredTenant());

    private readonly mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    constructor() {
        this.applyThemeAttributes();

        effect(
            () => {
            const mode = this.mode();
            localStorage.setItem(this.THEME_KEY, mode);
            if (mode === 'auto') {
                this.applyAutoTheme();
            } else {
                const match = this.themes.find(t => t.mode === mode);
                if (match) {
                    this.currentTheme.set(match);
                }
            }
            },
            { allowSignalWrites: true }
        );

        effect(() => {
            const theme = this.currentTheme();
            localStorage.setItem(this.THEME_KEY, this.mode());
            this.applyThemeAttributes();
            this.applyTenantBranding(this.tenant());
        });

        effect(() => {
            const density = this.density();
            localStorage.setItem(this.DENSITY_KEY, density);
            this.applyThemeAttributes();
        });

        effect(() => {
            const tenant = this.tenant();
            if (tenant) {
                localStorage.setItem(this.TENANT_KEY, JSON.stringify(tenant));
            } else {
                localStorage.removeItem(this.TENANT_KEY);
            }
            this.applyTenantBranding(tenant);
        });

        this.mediaQuery.addEventListener('change', () => {
            if (this.mode() === 'auto') {
                this.applyAutoTheme();
            }
        });
    }

    setMode(mode: MbThemeMode): void {
        this.mode.set(mode);
    }

    setDensity(mode: MbDensityMode): void {
        this.density.set(mode);
    }

    setTheme(themeId: string): void {
        const theme = this.themes.find(t => t.id === themeId);
        if (theme) {
            this.currentTheme.set(theme);
            this.mode.set(theme.mode);
        }
    }

    setTenantBranding(tenant?: MbTenantBranding): void {
        this.tenant.set(tenant);
    }

    private applyAutoTheme(): void {
        const prefersDark = this.mediaQuery.matches;
        const theme = this.themes.find(t => t.mode === (prefersDark ? 'dark' : 'light'));
        if (theme) {
            this.currentTheme.set(theme);
        }
    }

    private applyThemeAttributes(): void {
        const root = document.documentElement;
        const mode = this.mode();
        const theme = this.currentTheme();

        root.setAttribute('data-theme', theme.id);
        root.setAttribute('data-theme-id', theme.id);
        root.setAttribute('data-density', this.density());

        if (mode === 'auto') {
            root.setAttribute('data-theme-mode', 'auto');
        } else {
            root.removeAttribute('data-theme-mode');
        }
    }

    private applyTenantBranding(tenant?: MbTenantBranding): void {
        const root = document.documentElement;
        if (!tenant) {
            root.removeAttribute('data-tenant');
            root.style.removeProperty('--mb-tenant-logo-url');
            return;
        }

        root.setAttribute('data-tenant', tenant.tenantId);
        if (tenant.logoUrl) {
            root.style.setProperty('--mb-tenant-logo-url', `url("${tenant.logoUrl}")`);
        } else {
            root.style.removeProperty('--mb-tenant-logo-url');
        }

        const surface = this.readCssVar('--mb-color-surface') || '#ffffff';
        const primary = this.ensureContrast(tenant.primary, surface, 4.5);
        const isDarkSurface = this.relativeLuminance(surface) < 0.35;

        const hover = this.shiftLightness(primary, isDarkSurface ? 0.08 : -0.08);
        const active = this.shiftLightness(primary, isDarkSurface ? 0.16 : -0.16);
        const onPrimary = this.pickOnColor(primary);
        const selection = this.mix(primary, surface, isDarkSurface ? 0.35 : 0.18);
        const onSelection = this.pickOnColor(selection);

        root.style.setProperty('--mb-color-primary', primary);
        root.style.setProperty('--mb-color-primary-hover', hover);
        root.style.setProperty('--mb-color-primary-active', active);
        root.style.setProperty('--mb-color-on-primary', onPrimary);
        root.style.setProperty('--mb-color-link', primary);
        root.style.setProperty('--mb-color-selection', selection);
        root.style.setProperty('--mb-color-on-selection', onSelection);
    }

    private readCssVar(name: string): string | null {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || null;
    }

    private normalizeHex(hex: string): string | null {
        const normalized = hex.trim().replace('#', '');
        if (![3, 6].includes(normalized.length)) {
            return null;
        }
        const expanded = normalized.length === 3
            ? normalized.split('').map(c => c + c).join('')
            : normalized;
        if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
            return null;
        }
        return `#${expanded.toLowerCase()}`;
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const normalized = hex.replace('#', '');
        const int = parseInt(normalized, 16);
        return {
            r: (int >> 16) & 255,
            g: (int >> 8) & 255,
            b: int & 255
        };
    }

    private rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
        const toHex = (value: number) => value.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    private relativeLuminance(hex: string): number {
        const { r, g, b } = this.hexToRgb(hex);
        const toLinear = (value: number) => {
            const v = value / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        const rl = toLinear(r);
        const gl = toLinear(g);
        const bl = toLinear(b);
        return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
    }

    private contrastRatio(hexA: string, hexB: string): number {
        const l1 = this.relativeLuminance(hexA);
        const l2 = this.relativeLuminance(hexB);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    private mix(hexA: string, hexB: string, weight: number): string {
        const a = this.hexToRgb(hexA);
        const b = this.hexToRgb(hexB);
        const mixChannel = (x: number, y: number) => Math.round(x * weight + y * (1 - weight));
        return this.rgbToHex({
            r: mixChannel(a.r, b.r),
            g: mixChannel(a.g, b.g),
            b: mixChannel(a.b, b.b)
        });
    }

    private shiftLightness(hex: string, amount: number): string {
        const { r, g, b } = this.hexToRgb(hex);
        const toHsl = (rVal: number, gVal: number, bVal: number) => {
            const rNorm = rVal / 255;
            const gNorm = gVal / 255;
            const bNorm = bVal / 255;
            const max = Math.max(rNorm, gNorm, bNorm);
            const min = Math.min(rNorm, gNorm, bNorm);
            let h = 0;
            let s = 0;
            const l = (max + min) / 2;
            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case rNorm:
                        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
                        break;
                    case gNorm:
                        h = (bNorm - rNorm) / d + 2;
                        break;
                    default:
                        h = (rNorm - gNorm) / d + 4;
                }
                h /= 6;
            }
            return { h, s, l };
        };

        const toRgb = (h: number, s: number, l: number) => {
            if (s === 0) {
                const gray = Math.round(l * 255);
                return { r: gray, g: gray, b: gray };
            }
            const hue2rgb = (p: number, q: number, t: number) => {
                let tt = t;
                if (tt < 0) tt += 1;
                if (tt > 1) tt -= 1;
                if (tt < 1 / 6) return p + (q - p) * 6 * tt;
                if (tt < 1 / 2) return q;
                if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            const rVal = hue2rgb(p, q, h + 1 / 3);
            const gVal = hue2rgb(p, q, h);
            const bVal = hue2rgb(p, q, h - 1 / 3);
            return { r: Math.round(rVal * 255), g: Math.round(gVal * 255), b: Math.round(bVal * 255) };
        };

        const hsl = toHsl(r, g, b);
        const nextL = Math.min(1, Math.max(0, hsl.l + amount));
        return this.rgbToHex(toRgb(hsl.h, hsl.s, nextL));
    }

    private ensureContrast(primary: string, surface: string, targetRatio: number): string {
        const normalized = this.normalizeHex(primary);
        if (!normalized) {
            return this.readCssVar('--mb-color-primary') || '#2563eb';
        }

        let candidate = normalized;
        let ratio = this.contrastRatio(candidate, surface);
        if (ratio >= targetRatio) {
            return candidate;
        }

        const surfaceIsDark = this.relativeLuminance(surface) < 0.35;
        const step = surfaceIsDark ? 0.04 : -0.04;
        for (let i = 0; i < 12; i += 1) {
            candidate = this.shiftLightness(candidate, step);
            ratio = this.contrastRatio(candidate, surface);
            if (ratio >= targetRatio) {
                return candidate;
            }
        }
        return candidate;
    }

    private pickOnColor(bg: string): string {
        const white = '#ffffff';
        const dark = '#0b1220';
        return this.contrastRatio(bg, white) >= this.contrastRatio(bg, dark) ? white : dark;
    }

    private getStoredMode(): MbThemeMode {
        const stored = localStorage.getItem(this.THEME_KEY) as MbThemeMode;
        return stored && ['light', 'dark', 'auto'].includes(stored) ? stored : 'light';
    }

    private getStoredDensity(): MbDensityMode {
        const stored = localStorage.getItem(this.DENSITY_KEY) as MbDensityMode;
        return stored && ['comfortable', 'compact'].includes(stored) ? stored : 'comfortable';
    }

    private getStoredTheme(): MbThemeDefinition {
        const storedMode = this.getStoredMode();
        if (storedMode === 'auto') {
            return this.themes.find(t => t.mode === (this.mediaQuery.matches ? 'dark' : 'light')) || this.themes[0];
        }
        return this.themes.find(t => t.mode === storedMode) || this.themes[0];
    }

    private getStoredTenant(): MbTenantBranding | undefined {
        const stored = localStorage.getItem(this.TENANT_KEY);
        if (!stored) {
            return undefined;
        }
        try {
            return JSON.parse(stored) as MbTenantBranding;
        } catch {
            return undefined;
        }
    }
}
