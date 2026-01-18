import { Component, computed, inject } from '@angular/core';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from '../tenant-workspace-setup.shared';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';

@Component({
    selector: 'app-tenant-workspace-setup-classes-sections',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './tenant-workspace-setup-classes-sections.component.html',
    styleUrls: ['../tenant-workspace-setup.component.scss']
})
export class TenantWorkspaceSetupClassesSectionsComponent {
    readonly vm = inject(TenantWorkspaceSetupFacade);

    readonly staffSelectorOptions = computed(() => this.vm.users()
        .filter(user => ['Teacher', 'Staff'].includes(user.role))
        .map(user => ({
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            role: user.role,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)));
}
