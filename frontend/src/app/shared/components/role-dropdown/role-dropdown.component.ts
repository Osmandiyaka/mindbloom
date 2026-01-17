import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { MbPopoverComponent } from '@mindbloom/ui';
import { RoleService } from '../../../core/services/role.service';
import type { Role } from '../../../core/models/role.model';

@Component({
    selector: 'app-role-dropdown',
    standalone: true,
    imports: [CommonModule, MbPopoverComponent],
    template: `
        <div class="role-dropdown" [class.role-dropdown--open]="open">
            <button type="button" class="role-dropdown__trigger" #origin
                (click)="toggle()" [attr.aria-expanded]="open">
                <div class="role-dropdown__trigger-text">
                    <span class="role-dropdown__label">{{ selectedRole?.name || placeholder }}</span>
                    <span class="role-dropdown__meta" *ngIf="selectedRole?.description">
                        {{ selectedRole?.description }}
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
                        [class.role-dropdown__item--selected]="role.id === selectedRole?.id">
                        <div class="role-dropdown__item-main">
                            <div class="role-dropdown__item-title">{{ role.name }}</div>
                            <div class="role-dropdown__item-desc" *ngIf="role.description">{{ role.description }}</div>
                        </div>
                        <span class="role-dropdown__badge">
                            {{ role.isSystemRole ? 'System' : 'Custom' }}
                        </span>
                    </button>
                </div>
            </mb-popover>
        </div>
    `,
    styleUrls: ['./role-dropdown.component.scss']
})
export class RoleDropdownComponent implements OnInit {
    @Input() value = '';
    @Input() placeholder = 'Select role';
    @Output() valueChange = new EventEmitter<string>();
    @Output() roleChange = new EventEmitter<Role | null>();

    private readonly roleService = inject(RoleService);

    roles: Role[] = [];
    open = false;

    get selectedRole(): Role | null {
        return this.roles.find(role => role.name === this.value) || null;
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

    select(role: Role): void {
        this.valueChange.emit(role.name);
        this.roleChange.emit(role);
        this.open = false;
    }
}
