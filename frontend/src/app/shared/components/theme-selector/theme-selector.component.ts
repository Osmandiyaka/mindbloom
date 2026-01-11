import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MbThemeDefinition, MbThemeService } from '@mindbloom/ui';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
    selector: 'app-theme-selector',
    standalone: true,
    imports: [CommonModule, ClickOutsideDirective],
    templateUrl: './theme-selector.component.html',
    styleUrls: ['./theme-selector.component.scss']
})
export class ThemeSelectorComponent {
    private themeService = inject(MbThemeService);

    isOpen = signal(false);
    currentTheme = this.themeService.currentTheme;
    currentMode = this.themeService.mode;

    lightThemes = this.themeService.themes.filter(theme => theme.mode === 'light');
    darkThemes = this.themeService.themes.filter(theme => theme.mode === 'dark');

    toggleDropdown(): void {
        this.isOpen.update(v => !v);
    }

    closeDropdown(): void {
        this.isOpen.set(false);
    }

    selectTheme(theme: MbThemeDefinition): void {
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

    isActiveTheme(theme: MbThemeDefinition): boolean {
        return this.currentTheme().id === theme.id && !this.isAutoMode();
    }

    getThemeIcon(theme: MbThemeDefinition): string {
        return theme.mode === 'light' ? '☀️' : '🌙';
    }

    getCurrentIcon(): string {
        if (this.isAutoMode()) {
            return '🖥️';
        }
        return this.getThemeIcon(this.currentTheme());
    }
}
