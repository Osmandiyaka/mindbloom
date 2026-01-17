import { Component, inject } from '@angular/core';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from './tenant-workspace-setup.shared';
import { TenantWorkspaceSetupFacade } from './tenant-workspace-setup.facade';

@Component({
    selector: 'app-tenant-workspace-setup-grading',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './tenant-workspace-setup-grading.component.html',
    styleUrls: ['./tenant-workspace-setup.component.scss']
})
export class TenantWorkspaceSetupGradingComponent {
    readonly vm = inject(TenantWorkspaceSetupFacade);
}
