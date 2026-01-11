import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { TenantContextService, TenantMembership } from '../../../core/tenant/tenant-context.service';
import { TenantBootstrapService } from '../../../core/tenant/tenant-bootstrap.service';
import { SchoolContextService } from '../../../core/school/school-context.service';
import { School } from '../../../core/school/school.models';
import { ThemeSelectorComponent } from '../theme-selector/theme-selector.component';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { IconRegistryService } from '../../services/icon-registry.service';
import { SearchInputComponent } from '../search-input/search-input.component';

@Component({
    selector: 'app-global-toolbar',
    standalone: true,
    imports: [CommonModule, FormsModule, ThemeSelectorComponent, TooltipDirective, ClickOutsideDirective, SearchInputComponent],
    templateUrl: './global-toolbar.component.html',
    styleUrl: './global-toolbar.component.scss'
})
export class GlobalToolbarComponent {
    @Input() collapsed = false;
    @Input() isMobile = false;
    @Input() navOpen = false;
    @Output() navToggle = new EventEmitter<void>();
    @Output() sidebarToggle = new EventEmitter<void>();
    searchQuery: string = '';
    searchExpanded = false;
    tenantName = computed(() => this.tenantContextService.activeTenantSignal()?.tenantName || 'Organization');
    schoolName = computed(() => {
        const active = this.schoolContext.activeSchool();
        if (active?.name) {
            return active.name;
        }
        const list = this.schoolContext.schools();
        if (list.length === 1) {
            return list[0]?.name || 'School';
        }
        if (!list.length) {
            return 'Unassigned';
        }
        return 'Select school';
    });

    // Tenant switcher state
    tenantMenuOpen = signal(false);
    availableTenants = computed(() => {
        const session = this.authService.session();
        return session?.memberships || [];
    });
    availableSchools = computed(() => this.schoolContext.schools());
    isSwitchingTenant = signal(false);
    schoolMenuOpen = signal(false);
    isSchoolLoading = computed(() => this.schoolContext.isLoading());

    constructor(
        private authService: AuthService,
        private tenantService: TenantService,
        private tenantContextService: TenantContextService,
        private tenantBootstrap: TenantBootstrapService,
        private router: Router,
        private icons: IconRegistryService,
        private schoolContext: SchoolContextService
    ) { }

    icon(name: string) {
        return this.icons.icon(name);
    }

    onSearch(term?: string) {
        if (typeof term === 'string') {
            this.searchQuery = term;
        }
        console.log('Search:', this.searchQuery);
        // Implement global search functionality
    }

    toggleSearch() {
        this.searchExpanded = !this.searchExpanded;
    }

    onDashboardClick() {
        // Navigate to dashboard
    }

    onStudentsClick() {
        // Navigate to students
    }

    onCalendarClick() {
        // Navigate to calendar
    }

    onReportsClick() {
        // Navigate to reports
    }

    onMarketplaceClick() {
        this.router.navigate(['/setup/marketplace']);
    }

    onNotificationsClick() {
        // Show notifications
    }

    onMessagesClick() {
        // Navigate to messages
    }

    toggleTenantMenu() {
        this.tenantMenuOpen.update(v => !v);
    }

    closeTenantMenu() {
        this.tenantMenuOpen.set(false);
    }

    toggleSchoolMenu() {
        this.schoolMenuOpen.update(v => !v);
    }

    closeSchoolMenu() {
        this.schoolMenuOpen.set(false);
    }

    async switchTenant(tenant: TenantMembership): Promise<void> {
        // Don't switch if already active
        const current = this.tenantContextService.activeTenant();
        if (current?.tenantId === tenant.tenantId) {
            this.closeTenantMenu();
            return;
        }

        this.isSwitchingTenant.set(true);

        try {
            const success = await new Promise<boolean>((resolve) => {
                this.tenantBootstrap.switchTenant(tenant).subscribe({
                    next: (result) => resolve(result),
                    error: () => resolve(false)
                });
            });

            if (success) {
                // Close menu
                this.closeTenantMenu();

                // Navigate to dashboard (safe default)
                await this.router.navigate(['/dashboard']);
            } else {
                console.error('Failed to switch tenant');
                // TODO: Show error toast
            }
        } finally {
            this.isSwitchingTenant.set(false);
        }
    }

    switchSchool(school: School): void {
        const current = this.schoolContext.activeSchool();
        if (current?.id === school.id) {
            this.closeSchoolMenu();
            return;
        }

        this.schoolContext.setActiveSchool(school);
        this.closeSchoolMenu();
    }

    isActiveTenant(tenantId: string): boolean {
        return this.tenantContextService.activeTenant()?.tenantId === tenantId;
    }

    isActiveSchool(schoolId: string): boolean {
        return this.schoolContext.activeSchool()?.id === schoolId;
    }

    onLogout() {
        this.authService.logout();
    }

    onNavToggle() {
        this.navToggle.emit();
        this.sidebarToggle.emit();
    }
}
