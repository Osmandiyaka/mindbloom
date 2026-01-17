import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TenantWorkspaceSetupFacade } from './tenant-workspace-setup.facade';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from './tenant-workspace-setup.shared';
import { TenantSchoolsComponent } from './school-setup.component';
import { TenantWorkspaceSetupOrgUnitsComponent } from './tenant-workspace-setup-org-units.component';
import { TenantWorkspaceSetupLevelsComponent } from './tenant-workspace-setup-levels.component';
import { TenantWorkspaceSetupClassesSectionsComponent } from './tenant-workspace-setup-classes-sections.component';
import { TenantWorkspaceSetupGradingComponent } from './tenant-workspace-setup-grading.component';
import { TenantWorkspaceSetupUsersComponent } from './tenant-workspace-setup-users.component';
import { TenantWorkspaceSetupReviewComponent } from './tenant-workspace-setup-review.component';
import { TenantWorkspaceSetupCompleteComponent } from './tenant-workspace-setup-complete.component';

@Component({
    selector: 'app-tenant-workspace-setup',
    standalone: true,
    imports: [
        ...TENANT_WORKSPACE_SETUP_IMPORTS,
        TenantSchoolsComponent,
        TenantWorkspaceSetupOrgUnitsComponent,
        TenantWorkspaceSetupLevelsComponent,
        TenantWorkspaceSetupClassesSectionsComponent,
        TenantWorkspaceSetupGradingComponent,
        TenantWorkspaceSetupUsersComponent,
        TenantWorkspaceSetupReviewComponent,
        TenantWorkspaceSetupCompleteComponent,
    ],
    templateUrl: './tenant-workspace-setup.component.html',
    styleUrls: ['./tenant-workspace-setup.component.scss'],
    providers: [TenantWorkspaceSetupFacade],
})
export class TenantWorkspaceSetupComponent implements OnInit {
    readonly vm = inject(TenantWorkspaceSetupFacade);
    private readonly route = inject(ActivatedRoute);

    ngOnInit(): void {
        this.vm.init();
        this.route.queryParamMap.subscribe(params => {
            const stepParam = Number(params.get('step'));
            if (!Number.isFinite(stepParam) || stepParam <= 0) {
                this.vm.step.set(1);
                return;
            }
            this.vm.goToStep(stepParam);
        });
    }
}
