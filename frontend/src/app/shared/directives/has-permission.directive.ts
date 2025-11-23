import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';

/**
 * Structural directive that conditionally displays elements based on user permissions
 * 
 * Usage:
 * <button *hasPermission="'students:create'">Create Student</button>
 * <button *hasPermission="['students:update', 'students:delete']">Edit Student</button>
 */
@Directive({
    selector: '[hasPermission]',
    standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
    private templateRef = inject(TemplateRef<any>);
    private viewContainer = inject(ViewContainerRef);
    private authService = inject(AuthService);
    private destroy$ = new Subject<void>();

    private permissions: string[] = [];
    private hasView = false;

    @Input() set hasPermission(permissions: string | string[]) {
        this.permissions = Array.isArray(permissions) ? permissions : [permissions];
        this.updateView();
    }

    ngOnInit() {
        // Subscribe to auth state changes
        this.authService.currentUser$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.updateView();
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private updateView() {
        const hasPermission = this.checkPermissions();

        if (hasPermission && !this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
        } else if (!hasPermission && this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
        }
    }

    private checkPermissions(): boolean {
        const user = this.authService.getCurrentUser();

        if (!user) {
            return false;
        }

        // SuperAdmin has all permissions
        if (this.isSuperAdmin(user)) {
            return true;
        }

        // Check if user's role has the required permissions
        return this.permissions.every(permission =>
            this.hasPermissionInRole(user, permission)
        );
    }

    private isSuperAdmin(user: any): boolean {
        return user.role?.name === 'SuperAdmin';
    }

    private hasPermissionInRole(user: any, requiredPermission: string): boolean {
        if (!user.role || !user.role.permissions) {
            return false;
        }

        const [resource, action] = requiredPermission.split(':');

        return user.role.permissions.some((permission: any) => {
            return permission.resource === resource &&
                (permission.actions.includes(action) ||
                    permission.actions.includes('manage'));
        });
    }
}
