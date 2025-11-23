import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, ThemeDefinition, ThemeMode } from '../../../core/services/theme.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
    selector: 'app-theme-selector',
    standalone: true,
    imports: [CommonModule, ClickOutsideDirective],
    templateUrl: './theme-selector.component.html',
    styleUrls: ['./theme-selector.component.scss']
})
export class ThemeSelectorComponent {
    private themeService = inject(ThemeService);

    isOpen = signal(false);
    currentTheme = this.themeService.currentTheme;
    currentMode = this.themeService.currentMode;

    lightThemes = this.themeService.getThemesByMode('light');
    darkThemes = this.themeService.getThemesByMode('dark');

    toggleDropdown(): void {
        this.isOpen.update(v => !v);
    }

    closeDropdown(): void {
        this.isOpen.set(false);
    }

    selectTheme(theme: ThemeDefinition): void {
        this.themeService.setTheme(theme.id);
        this.closeDropdown();
    }

    setAutoMode(): void {
        this.themeService.setMode('auto');
        this.closeDropdown();
    }

    isAutoMode(): boolean {
        return this.currentMode() === 'auto';
    }

    isActiveTheme(theme: ThemeDefinition): boolean {
        return this.currentTheme().id === theme.id && !this.isAutoMode();
    }

    getThemeIcon(theme: ThemeDefinition): string {
        return theme.mode === 'light' ? '☀️' : '🌙';
    }

    getCurrentIcon(): string {
        if (this.isAutoMode()) {
            return '🖥️';
        }
        return this.getThemeIcon(this.currentTheme());
    }
}
