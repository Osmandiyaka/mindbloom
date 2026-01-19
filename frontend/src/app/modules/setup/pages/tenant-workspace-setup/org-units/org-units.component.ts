import { Component, inject } from '@angular/core';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from '../tenant-workspace-setup.shared';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';

@Component({
    selector: 'app-tenant-workspace-setup-org-units',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './org-units.component.html',
    styleUrls: ['../tenant-workspace-setup.component.scss', './org-units.component.scss']
})
export class TenantWorkspaceSetupOrgUnitsComponent {
    readonly vm = inject(TenantWorkspaceSetupFacade);

    trackUserRow = (_: number, user: { id: string }) => user.id;
}
