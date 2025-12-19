import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AuthorizationService } from '../security/authorization.service';
import { BehaviorSubject, Subject, switchMap, takeUntil } from 'rxjs';

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
    private authorization = inject(AuthorizationService);
    private destroy$ = new Subject<void>();

    private permissions$ = new BehaviorSubject<string[]>([]);
    private hasView = false;

    @Input() set hasPermission(permissions: string | string[]) {
        const normalized = this.normalize(Array.isArray(permissions) ? permissions : [permissions]);
        this.permissions$.next(normalized);
    }

    ngOnInit() {
        void this.authService.ensureRbacLoaded();

        this.permissions$
            .pipe(
                switchMap((perms) => this.authorization.can$(perms, 'all')),
                takeUntil(this.destroy$),
            )
            .subscribe((hasPermission) => this.render(hasPermission));
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private render(hasPermission: boolean) {
        if (hasPermission && !this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
        } else if (!hasPermission && this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
        }
    }

    private normalize(perms: string[]): string[] {
        return perms.map((p) => p.replace(/:/g, '.').trim().toLowerCase());
    }
}
