import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from '../tenant-workspace-setup.shared';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';

@Component({
    selector: 'app-tenant-workspace-setup-complete',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './tenant-workspace-setup-complete.component.html',
    styleUrls: ['../workspace-setup.shared.scss']
})
export class TenantWorkspaceSetupCompleteComponent {
    readonly vm = inject(TenantWorkspaceSetupFacade);
    private readonly router = inject(Router);

    navigateToSection(section: 'schools' | 'users' | 'org-units'): void {
        this.router.navigate(['/workspace-setup', section]);
    }
}
