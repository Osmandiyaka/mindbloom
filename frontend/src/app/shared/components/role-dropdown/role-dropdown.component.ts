import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { MbPopoverComponent } from '@mindbloom/ui';
import { RoleService } from '../../../core/services/role.service';
import type { Role } from '../../../core/models/role.model';

export type RoleSelection = {
    ids: string[];
    names: string[];
    roles: Role[];
};

@Component({
    selector: 'app-role-dropdown',
    standalone: true,
    imports: [CommonModule, MbPopoverComponent],
    template: `
        <div class="role-dropdown"
            [class.role-dropdown--open]="open"
            [class.role-dropdown--flush]="flush">
            <button type="button" class="role-dropdown__trigger" #origin
                (click)="toggle()" [attr.aria-expanded]="open">
                <div class="role-dropdown__trigger-text">
                    <span class="role-dropdown__label">{{ displayLabel }}</span>
                    <span class="role-dropdown__meta" *ngIf="displayMeta">
                        {{ displayMeta }}
                    </span>
                </div>
                <span class="role-dropdown__chevron" aria-hidden="true">▾</span>
            </button>
            <mb-popover
                [open]="open"
                [origin]="origin"
                [hasBackdrop]="true"
                [panelClass]="['mb-popover-panel', 'role-dropdown__panel']"
                (closed)="close()">
                <div class="role-dropdown__list" role="listbox">
                    <button type="button" class="role-dropdown__item"
                        *ngFor="let role of roles"
                        (click)="select(role)"
                        [class.role-dropdown__item--selected]="isSelected(role)">
                        <div class="role-dropdown__item-main">
                            <div class="role-dropdown__item-title">{{ role.name }}</div>
                            <div class="role-dropdown__item-desc" *ngIf="role.description">{{ role.description }}</div>
                        </div>
                        <div class="role-dropdown__item-meta">
                            <span class="role-dropdown__check" *ngIf="isSelected(role)" aria-hidden="true">✓</span>
                            <span class="role-dropdown__badge">
                                {{ role.isSystemRole ? 'System' : 'Custom' }}
                            </span>
                        </div>
                    </button>
                </div>
            </mb-popover>
        </div>
    `,
    styleUrls: ['./role-dropdown.component.scss']
})
export class RoleDropdownComponent implements OnInit {
    @Input() value = '';
    @Input() selectedIds: string[] = [];
    @Input() multiple = false;
    @Input() flush = false;
    @Input() placeholder = 'Select role';
    @Output() valueChange = new EventEmitter<string>();
    @Output() roleChange = new EventEmitter<Role | null>();
    @Output() selectedIdsChange = new EventEmitter<string[]>();
    @Output() rolesChange = new EventEmitter<Role[]>();
    @Output() selectionChange = new EventEmitter<RoleSelection>();

    private readonly roleService = inject(RoleService);

    roles: Role[] = [];
    open = false;

    get selectedRoles(): Role[] {
        if (this.selectedIds.length) {
            const selected = new Set(this.selectedIds);
            return this.roles.filter(role => selected.has(role.id));
        }
        if (this.value) {
            const match = this.roles.find(role => role.name === this.value);
            return match ? [match] : [];
        }
        return [];
    }

    get selectedRole(): Role | null {
        return this.selectedRoles[0] || null;
    }

    get displayLabel(): string {
        const selected = this.selectedRoles;
        if (!selected.length) return this.placeholder;
        if (!this.multiple) return selected[0].name;
        if (selected.length === 1) return selected[0].name;
        return `${selected.length} roles selected`;
    }

    get displayMeta(): string {
        const selected = this.selectedRoles;
        if (!selected.length) return '';
        if (!this.multiple && selected[0]?.description) return selected[0].description;
        if (this.multiple && selected.length > 1) {
            return selected.map(role => role.name).slice(0, 2).join(', ');
        }
        return '';
    }

    ngOnInit(): void {
        this.roleService.getRoles().subscribe({
            next: (roles) => {
                this.roles = roles || [];
            },
            error: () => {
                this.roles = [];
            },
        });
    }

    toggle(): void {
        this.open = !this.open;
    }

    close(): void {
        this.open = false;
    }

    isSelected(role: Role): boolean {
        if (this.selectedIds.length) {
            return this.selectedIds.includes(role.id);
        }
        return role.name === this.value;
    }

    select(role: Role): void {
        if (this.multiple) {
            const selected = new Set(this.selectedIds);
            if (selected.has(role.id)) {
                selected.delete(role.id);
            } else {
                selected.add(role.id);
            }
            const nextIds = Array.from(selected);
            const nextRoles = this.roles.filter(item => nextIds.includes(item.id));
            this.selectedIdsChange.emit(nextIds);
            this.rolesChange.emit(nextRoles);
            this.selectionChange.emit({
                ids: nextIds,
                names: nextRoles.map(item => item.name),
                roles: nextRoles,
            });
            return;
        }
        this.valueChange.emit(role.name);
        this.roleChange.emit(role);
        this.selectedIdsChange.emit([role.id]);
        this.rolesChange.emit([role]);
        this.selectionChange.emit({
            ids: [role.id],
            names: [role.name],
            roles: [role],
        });
        this.open = false;
    }
}
