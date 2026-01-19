import { Component, computed, inject } from '@angular/core';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from '../tenant-workspace-setup.shared';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';
import { ClassesSectionsFacade } from './classes-sections.facade';

@Component({
    selector: 'app-tenant-workspace-setup-classes-sections',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './class-sections.component.html',
    styleUrls: ['../tenant-workspace-setup.component.scss', './class-sections.component.scss']
})
export class TenantWorkspaceSetupClassesSectionsComponent {
    readonly vm = inject(ClassesSectionsFacade);
    readonly setupVm = inject(TenantWorkspaceSetupFacade);

    readonly staffSelectorOptions = computed(() => this.setupVm.users()
        .filter(user => ['Teacher', 'Staff'].includes(user.roleName || ''))
        .map(user => ({
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            role: user.roleName || '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name)));
}
