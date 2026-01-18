import { Component, inject } from '@angular/core';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from '../tenant-workspace-setup.shared';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';
import { UserSerivce } from './user-serivce.service';

@Component({
    selector: 'app-tenant-users',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './users-setup.component.html',
    styleUrls: ['./users-setup.component.scss']
})
export class TenantUsersComponent {
    readonly vm = inject(UserSerivce);
    private readonly setup = inject(TenantWorkspaceSetupFacade);

    back(): void {
        this.setup.back();
    }

    next(): void {
        this.setup.next();
    }

    skipUsersStep(): void {
        this.vm.usersStepSkipped.set(true);
        this.setup.attemptedContinue.set(false);
        this.setup.next();
    }
}
