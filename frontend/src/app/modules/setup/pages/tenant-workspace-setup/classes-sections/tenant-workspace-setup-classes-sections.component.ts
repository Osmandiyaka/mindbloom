import { Component, OnInit, computed, inject } from '@angular/core';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from '../tenant-workspace-setup.shared';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup.facade';
import { ClassesSectionsFacade } from './classes-sections.facade';
import { SchoolContextService } from '../../../../../core/school/school-context.service';

@Component({
    selector: 'app-tenant-workspace-setup-classes-sections',
    standalone: true,
    imports: [...TENANT_WORKSPACE_SETUP_IMPORTS],
    templateUrl: './class-sections.component.html',
    styleUrls: ['../tenant-workspace-setup.component.scss', './class-sections.component.scss']
})
export class TenantWorkspaceSetupClassesSectionsComponent implements OnInit {
    readonly vm = inject(ClassesSectionsFacade);
    private readonly schoolContext = inject(SchoolContextService);
    readonly setupVm = inject(TenantWorkspaceSetupFacade);

    readonly schoolOptions = computed(() => this.schoolContext.schools()
        .map(school => ({ id: school.id, name: school.name }))
        .sort((a, b) => a.name.localeCompare(b.name)));

    readonly hasMultipleSchools = computed(() => this.schoolOptions().length > 1);

    ngOnInit(): void {
        this.vm.loadFromApi();
    }
}
