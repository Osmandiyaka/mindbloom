/**
 * Module Not Enabled Component
 * 
 * Displayed when user attempts to access a module that's not included in their edition.
 * Provides upgrade guidance and navigation options.
 */

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleKey, MODULE_NAMES } from '../../types/module-keys';
import { EditionService } from '../../services/entitlements.service';
import { AuthorizationService } from '../../security/authorization.service';
import { PERMISSIONS } from '../../../core/rbac/permission.constants';
import { GatedLandingPanelComponent } from '../../components/entitlements/gated-landing-panel/gated-landing-panel.component';
import { RequestAccessModalComponent } from '../../components/entitlements/request-access-modal/request-access-modal.component';
import { LockCtaType, LockReason } from '../../types/entitlement-lock';

@Component({
    selector: 'app-module-not-enabled',
    standalone: true,
    imports: [CommonModule, GatedLandingPanelComponent, RequestAccessModalComponent],
    template: `
        <app-gated-landing-panel
            [title]="panelTitle()"
            [subtitle]="panelSubtitle()"
            [bullets]="panelBullets()"
            [reason]="lockReason()"
            [context]="lockContext()"
            (action)="handleAction($event)"
            (viewPlans)="goToSetup()"
            (back)="goBack()">
        </app-gated-landing-panel>

        <app-request-access-modal
            [open]="requestAccessOpen()"
            [target]="requestAccessTarget()"
            (close)="requestAccessOpen.set(false)"
            (submitRequest)="submitAccessRequest($event)">
        </app-request-access-modal>
    `,
    styles: [`
        :host {
            display: block;
        }
    `]
})
export class ModuleNotEnabledComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly entitlements = inject(EditionService);
    private readonly authorization = inject(AuthorizationService);

    // Signals for component state
    readonly moduleKey = signal<ModuleKey | null>(null);
    readonly moduleName = signal<string | null>(null);
    readonly returnUrl = signal<string | null>(null);
    readonly currentEdition = signal<string | null>(null);
    readonly lockReason = signal<LockReason>('NOT_IN_PLAN');
    readonly requestAccessOpen = signal(false);
    readonly requestAccessTarget = signal('');
    readonly requiredPlan = signal<string | null>(null);
    readonly isBillingAdmin = computed(() => this.authorization.can(PERMISSIONS.setup.write));

    readonly panelTitle = computed(() => {
        const name = this.moduleName();
        return name ? `${name} is not available on your plan` : 'This module is not available';
    });

    readonly panelSubtitle = computed(() => {
        const edition = this.currentEdition();
        return edition
            ? `Your tenant is on ${edition}.`
            : 'Your tenant does not have access to this module.';
    });

    readonly panelBullets = computed(() => [
        'Module access is managed at the tenant level.',
        'Plans and overrides determine availability.',
        'Use the actions below to request access.',
    ]);

    readonly lockContext = computed(() => ({
        requiredPlan: this.requiredPlan() || this.requiredPlanForModule(),
        moduleName: this.moduleName() || undefined,
        isBillingAdmin: this.isBillingAdmin(),
    }));

    ngOnInit(): void {
        // Read query params
        this.route.queryParams.subscribe(params => {
            const moduleKey = params['module'] as ModuleKey;
            const returnUrl = params['returnUrl'];
            const reason = params['reason'] as LockReason | undefined;
            const requiredPlan = params['requiredPlan'];

            if (moduleKey) {
                this.moduleKey.set(moduleKey);
                this.moduleName.set(MODULE_NAMES[moduleKey] || moduleKey);
            }

            if (returnUrl) {
                this.returnUrl.set(returnUrl);
            }

            if (reason) {
                this.lockReason.set(reason);
            }
            if (requiredPlan) {
                this.requiredPlan.set(requiredPlan);
            }
        });

        // Get current edition
        const code = this.entitlements.getCurrentEdition();
        if (code) {
            this.currentEdition.set(code);
        }
    }

    goToSetup(): void {
        this.router.navigate(['/setup/plan-entitlements']);
    }

    goBack(): void {
        const url = this.returnUrl();
        if (url) {
            this.router.navigateByUrl(url);
        } else {
            this.router.navigate(['/dashboard']);
        }
    }

    handleAction(action: LockCtaType): void {
        if (action === 'view_plans' || action === 'request_change' || action === 'view_overrides') {
            this.goToSetup();
            return;
        }
        if (action === 'request_access') {
            this.requestAccessTarget.set(this.moduleName() || 'Module access');
            this.requestAccessOpen.set(true);
            return;
        }
        if (action === 'copy_details') {
            const details = `${this.moduleName() || 'Module'} access request`;
            navigator.clipboard?.writeText(details);
        }
    }

    submitAccessRequest(_payload: { reason: string }): void {
        this.requestAccessOpen.set(false);
    }

    private requiredPlanForModule(): string | undefined {
        const key = this.moduleKey();
        if (!key) {
            return undefined;
        }
        const premiumModules = new Set<ModuleKey>([
            'fees',
            'accounting',
            'library',
            'transport',
            'hr',
            'payroll',
        ]);
        if (premiumModules.has(key)) {
            return 'Premium';
        }
        return 'Professional';
    }
}
