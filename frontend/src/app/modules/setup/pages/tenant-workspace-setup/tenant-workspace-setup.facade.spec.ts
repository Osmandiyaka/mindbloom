import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TenantWorkspaceSetupFacade } from './tenant-workspace-setup.facade';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { SchoolService } from '../../../../core/school/school.service';
import { ToastService } from '../../../../core/ui/toast/toast.service';
import { ClassSectionService } from '../../../../core/services/class-section.service';

describe('TenantWorkspaceSetupFacade (users)', () => {
    let facade: TenantWorkspaceSetupFacade;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                TenantWorkspaceSetupFacade,
                { provide: TenantSettingsService, useValue: {} },
                { provide: TenantService, useValue: {} },
                { provide: SchoolService, useValue: {} },
                { provide: ToastService, useValue: { success: () => {}, error: () => {} } },
                { provide: ClassSectionService, useValue: {} },
                { provide: Router, useValue: { navigateByUrl: () => {} } },
            ],
        });

        facade = TestBed.inject(TenantWorkspaceSetupFacade);
    });

    it('requires users unless the step is skipped', () => {
        facade.users.set([]);
        facade.usersStepSkipped.set(false);
        expect(facade.canContinueUsersStep()).toBe(false);

        facade.usersStepSkipped.set(true);
        expect(facade.canContinueUsersStep()).toBe(true);

        facade.users.set([
            {
                id: 'user-1',
                name: 'Test User',
                email: 'test@school.com',
                role: 'Staff',
                schoolAccess: 'all',
                status: 'Active',
            },
        ]);
        facade.usersStepSkipped.set(false);
        expect(facade.canContinueUsersStep()).toBe(true);
    });
});
