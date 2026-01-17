import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TenantWorkspaceSetupFacade } from './tenant-workspace-setup.facade';
import { TenantSettingsService } from '../../../../core/services/tenant-settings.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { SchoolService } from '../../../../core/school/school.service';
import { ToastService } from '../../../../core/ui/toast/toast.service';
import { ClassSectionService } from '../../../../core/services/class-section.service';

describe('TenantWorkspaceSetupFacade (create user)', () => {
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

    it('requires name, email, and role before submitting', () => {
        facade.openCreateUserModal();
        expect(facade.createCanSubmit()).toBe(false);
        facade.createName.set('Ama Mensah');
        facade.createEmail.set('ama@school.com');
        expect(facade.createCanSubmit()).toBe(true);
    });

    it('requires at least one selected school when access is limited', () => {
        facade.openCreateUserModal();
        facade.setCreateSchoolAccess('selected');
        expect(facade.createCanSubmit()).toBe(false);
        expect(facade.createSchoolAccessError(true)).toBe('Select at least one school.');
    });

    it('prompts for discard when closing a dirty form', () => {
        facade.openCreateUserModal();
        facade.createName.set('Changed');
        facade.requestCloseCreateUserModal();
        expect(facade.createDiscardOpen()).toBe(true);
    });

    it('flags duplicate email addresses', () => {
        facade.users.set([{
            id: 'user-1',
            name: 'Existing User',
            email: 'existing@school.com',
            role: 'Staff',
            schoolAccess: 'all',
            status: 'Active',
        }]);
        facade.openCreateUserModal();
        facade.createEmail.set('existing@school.com');
        facade.createEmailTouched.set(true);
        expect(facade.createEmailError()).toBe('Email already exists.');
        expect(facade.createEmailDuplicate()).toBe(true);
    });
});
