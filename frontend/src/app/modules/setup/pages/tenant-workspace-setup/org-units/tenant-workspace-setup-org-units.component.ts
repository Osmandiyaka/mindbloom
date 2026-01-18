import { Component, inject } from '@angular/core';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from '../tenant-workspace-setup.shared';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';
import { UserSerivce } from '../users/user-serivce.service';

@Component({
    selector: 'app-tenant-workspace-setup-org-units',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './tenant-workspace-setup-org-units.component.html',
    styleUrls: ['../tenant-workspace-setup.component.scss']
})
export class TenantWorkspaceSetupOrgUnitsComponent {
    readonly vm = inject(TenantWorkspaceSetupFacade);
    readonly usersVm = inject(UserSerivce);
}
