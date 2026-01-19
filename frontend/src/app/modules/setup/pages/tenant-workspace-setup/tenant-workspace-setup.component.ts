import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TenantWorkspaceSetupFacade } from './tenant-workspace-setup.facade';
import { ClassesSectionsFacade } from './classes-sections/classes-sections.facade';
import { TENANT_WORKSPACE_SETUP_IMPORTS } from './tenant-workspace-setup.shared';
import { TenantSchoolsComponent } from './school/school-setup.component';
import { TenantWorkspaceSetupOrgUnitsComponent } from './org-units/org-units.component';
import { TenantWorkspaceSetupLevelsComponent } from './levels/tenant-workspace-setup-levels.component';
import { TenantWorkspaceSetupClassesSectionsComponent } from './classes-sections/tenant-workspace-setup-classes-sections.component';
import { TenantWorkspaceSetupGradingComponent } from './grading/tenant-workspace-setup-grading.component';
import { TenantUsersComponent } from './users/users-setup.component';
import { TenantWorkspaceSetupReviewComponent } from './review/tenant-workspace-setup-review.component';
import { TenantWorkspaceSetupCompleteComponent } from './complete/tenant-workspace-setup-complete.component';

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
        TenantUsersComponent,
        TenantWorkspaceSetupReviewComponent,
        TenantWorkspaceSetupCompleteComponent,
    ],
    templateUrl: './tenant-workspace-setup.component.html',
    styleUrls: ['./tenant-workspace-setup.component.scss'],
    providers: [TenantWorkspaceSetupFacade, ClassesSectionsFacade],
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
