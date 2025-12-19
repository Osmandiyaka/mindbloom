/**
 * Can Directive - Structural Directive for UI Authorization
 * 
 * Conditionally renders elements based on user permissions.
 * Integrates with AuthorizationService for real-time permission checks.
 * 
 * Usage:
 * <button *can="'students.write'">Add Student</button>
 * <button *can="['students.write', 'students.delete']; canMode: 'any'">Actions</button>
 * <div *can="'admin.access'; else noAccess">Admin Panel</div>
 * 
 * Features:
 * - Removes unauthorized elements from DOM (not just hidden)
 * - Reactive: updates when permissions change
 * - Supports 'all' or 'any' mode for multiple permissions
 * - Supports else template for fallback content
 */

import {
    Directive,
    Input,
    TemplateRef,
    ViewContainerRef,
    OnInit,
    OnDestroy,
    inject
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthorizationService, AuthorizationMode } from './authorization.service';

@Directive({
    selector: '[can]',
    standalone: true
})
export class CanDirective implements OnInit, OnDestroy {
    private readonly templateRef = inject(TemplateRef<any>);
    private readonly viewContainer = inject(ViewContainerRef);
    private readonly authService = inject(AuthorizationService);
    private readonly destroy$ = new Subject<void>();
    private readonly subscription$ = new Subject<void>();

    private permissions: string | string[] = [];
    private mode: AuthorizationMode = 'all';
    private elseTemplate: TemplateRef<any> | null = null;
    private hasView = false;
    private hasElseView = false;

    /**
     * Required permissions (string or array of strings)
     */
    @Input() set can(permissions: string | string[]) {
        this.permissions = permissions;
        this.setupSubscription();
    }

    /**
     * Mode: 'all' requires ALL permissions, 'any' requires AT LEAST ONE
     * Default: 'all'
     */
    @Input() set canMode(mode: AuthorizationMode) {
        this.mode = mode;
        this.setupSubscription();
    }

    /**
     * Optional else template to show when permission is denied
     */
    @Input() set canElse(template: TemplateRef<any> | null) {
        this.elseTemplate = template;
        this.setupSubscription();
    }

    ngOnInit() {
        this.setupSubscription();
    }

    private setupSubscription() {
        if (!this.permissions) {
            return;
        }

        // Cancel previous subscription
        this.subscription$.next();

        // Convert permissions to array for consistency
        const permArray = Array.isArray(this.permissions)
            ? this.permissions
            : [this.permissions];

        this.authService.can$(permArray, this.mode)
            .pipe(takeUntil(this.subscription$), takeUntil(this.destroy$))
            .subscribe(hasPermission => {
                if (hasPermission) {
                    this.showMainTemplate();
                } else {
                    this.showElseTemplate();
                }
            });
    }

    ngOnDestroy() {
        this.subscription$.next();
        this.subscription$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    private showMainTemplate() {
        // Clear else template if present
        if (this.hasElseView) {
            this.viewContainer.clear();
            this.hasElseView = false;
        }

        // Show main template if not already shown
        if (!this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
        }
    }

    private showElseTemplate() {
        // Clear main template if present
        if (this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
        }

        // Show else template if available and not already shown
        if (this.elseTemplate && !this.hasElseView) {
            this.viewContainer.createEmbeddedView(this.elseTemplate);
            this.hasElseView = true;
        }
    }
}
