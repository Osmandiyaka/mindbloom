import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../core/models/role.model';
import { RoleService } from '../../../core/services/role.service';

@Component({
    selector: 'app-role-selector',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './role-selector.component.html',
    styleUrls: ['./role-selector.component.scss'],
})
export class RoleSelectorComponent implements OnInit {
    private static openInstance: RoleSelectorComponent | null = null;
    @Input() selectedRoleIds: string[] = [];
    @Output() selectionChange = new EventEmitter<Role[]>();

    isOpen = signal(false);
    search = signal('');
    selected = signal<Set<string>>(new Set());

    roles = this.roleService.roles;
    loading = this.roleService.loading;

    filteredRoles = computed(() => {
        const term = this.search().toLowerCase().trim();
        return this.roles().filter((role) => {
            if (!term) return true;
            return (
                role.name.toLowerCase().includes(term) ||
                role.description?.toLowerCase().includes(term) ||
                (role.isSystemRole ? 'system' : 'custom').includes(term)
            );
        });
    });

    selectedCount = computed(() => this.selected().size);

    constructor(private readonly roleService: RoleService) { }

    ngOnInit(): void {
        if (this.selectedRoleIds?.length) {
            this.selected.set(new Set(this.selectedRoleIds));
        }
        if (!this.roles().length) {
            this.roleService.getRoles().subscribe();
        }
    }

    open(): void {
        // Ensure only one role selector overlay is open at a time.
        if (RoleSelectorComponent.openInstance && RoleSelectorComponent.openInstance !== this) {
            RoleSelectorComponent.openInstance.close();
        }
        RoleSelectorComponent.openInstance = this;
        this.isOpen.set(true);
        if (!this.roles().length) {
            this.roleService.getRoles().subscribe();
        }
    }

    close(): void {
        this.isOpen.set(false);
        if (RoleSelectorComponent.openInstance === this) {
            RoleSelectorComponent.openInstance = null;
        }
    }

    toggle(role: Role): void {
        const current = new Set(this.selected());
        if (current.has(role.id)) {
            current.delete(role.id);
        } else {
            current.add(role.id);
        }
        this.selected.set(current);
    }

    isSelected(roleId: string): boolean {
        return this.selected().has(roleId);
    }

    confirm(): void {
        const selectedRoles = this.roles().filter((r) => this.selected().has(r.id));
        this.selectionChange.emit(selectedRoles);
        this.close();
    }
}
