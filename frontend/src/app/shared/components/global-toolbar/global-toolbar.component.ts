import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SchoolContextService } from '../../../core/school/school-context.service';
import { School } from '../../../core/school/school.models';
import { RbacService } from '../../../core/rbac/rbac.service';
import { ThemeSelectorComponent } from '../theme-selector/theme-selector.component';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { IconRegistryService } from '../../services/icon-registry.service';
import { SearchInputComponent } from '../search-input/search-input.component';

@Component({
    selector: 'app-global-toolbar',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ThemeSelectorComponent, TooltipDirective, ClickOutsideDirective, SearchInputComponent],
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
    availableSchools = computed(() => this.schoolContext.schools());
    filteredSchools = computed(() => {
        const query = this.schoolSearch().trim().toLowerCase();
        const list = this.availableSchools();
        if (!query) {
            return list;
        }
        return list.filter((school) => {
            const name = school.name?.toLowerCase() || '';
            const code = school.code?.toLowerCase() || '';
            const domain = school.domain?.toLowerCase() || '';
            return name.includes(query) || code.includes(query) || domain.includes(query);
        });
    });
    schoolMenuOpen = signal(false);
    isSchoolLoading = computed(() => this.schoolContext.isLoading());
    schoolSearch = signal('');
    canManageSchools = computed(() => this.rbac.canAny([
        'system.settings.read',
        'system.settings.update',
        'system.settings.*',
        'system.*'
    ]));

    constructor(
        private authService: AuthService,
        private router: Router,
        private icons: IconRegistryService,
        private schoolContext: SchoolContextService,
        private rbac: RbacService
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

    toggleSchoolMenu() {
        this.schoolMenuOpen.update(v => !v);
    }

    closeSchoolMenu() {
        this.schoolMenuOpen.set(false);
        this.schoolSearch.set('');
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
