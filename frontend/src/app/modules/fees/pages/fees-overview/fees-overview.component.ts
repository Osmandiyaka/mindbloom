import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../../../shared/components/hero/hero.component';
import { UiButtonComponent } from '../../../../shared/ui/buttons/ui-button.component';
import { LockedPopoverComponent } from '../../../../shared/components/entitlements/locked-popover/locked-popover.component';
import { RequestAccessModalComponent } from '../../../../shared/components/entitlements/request-access-modal/request-access-modal.component';
import { AuthorizationService } from '../../../../shared/security/authorization.service';
import { PERMISSIONS } from '../../../../core/rbac/permission.constants';
import { LockCtaType, LockReason } from '../../../../shared/types/entitlement-lock';

@Component({
    selector: 'app-fees-overview',
    standalone: true,
    imports: [CommonModule, HeroComponent, UiButtonComponent, LockedPopoverComponent, RequestAccessModalComponent],
    template: `
    <div>
      <app-hero
        title="Fee Management"
        subtitle="Manage fee structure, collection, and student payments"
        image="assets/illustrations/finance.svg"
      />
      <div class="fees-toolbar">
        <div class="toolbar-group" (click)="toggleExportLock($event)">
          <ui-button
            size="sm"
            variant="ghost"
            [disabled]="true">
            Export
          </ui-button>
          <div class="popover-anchor">
            <app-locked-popover
              [open]="exportLockOpen()"
              [reason]="exportLockReason"
              [context]="exportLockContext()"
              (action)="handleLockAction($event)">
            </app-locked-popover>
          </div>
        </div>
      </div>

      <app-request-access-modal
        [open]="requestAccessOpen()"
        [target]="'Export (Fees)'"
        (close)="requestAccessOpen.set(false)"
        (submitRequest)="requestAccessOpen.set(false)">
      </app-request-access-modal>
    </div>
  `,
    styles: [`
      .fees-toolbar {
        display: flex;
        justify-content: flex-end;
        padding: 12px 0;
        position: relative;
      }

      .toolbar-group {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: not-allowed;
      }

      .popover-anchor {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
      }
    `]
})
export class FeesOverviewComponent {
    private readonly authorization = inject(AuthorizationService);

    exportLockOpen = signal(false);
    requestAccessOpen = signal(false);
    exportLockReason: LockReason = 'NOT_IN_PLAN';
    exportLockContext = computed(() => ({
        requiredPlan: 'Premium',
        featureName: 'Export',
        isBillingAdmin: this.authorization.can(PERMISSIONS.setup.write),
    }));

    toggleExportLock(event: Event): void {
        event.preventDefault();
        this.exportLockOpen.set(!this.exportLockOpen());
    }

    handleLockAction(action: LockCtaType): void {
        if (action === 'view_plans' || action === 'request_change') {
            this.exportLockOpen.set(false);
        }
        if (action === 'request_access') {
            this.exportLockOpen.set(false);
            this.requestAccessOpen.set(true);
        }
    }
}
