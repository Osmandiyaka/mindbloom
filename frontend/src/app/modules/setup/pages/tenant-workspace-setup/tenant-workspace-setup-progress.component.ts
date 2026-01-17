import { Component, inject } from '@angular/core';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from './tenant-workspace-setup.shared';
import { TenantWorkspaceSetupFacade } from './tenant-workspace-setup.facade';

@Component({
    selector: 'app-tenant-workspace-setup-progress',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './tenant-workspace-setup-progress.component.html',
    styleUrls: ['./tenant-workspace-setup.component.scss']
})
export class TenantWorkspaceSetupProgressComponent {
    readonly vm = inject(TenantWorkspaceSetupFacade);
}
