import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TenantSchoolsComponent } from './school-setup.component';
import { ApiClient } from '../../../../core/http/api-client.service';

const SCHOOLS = [
    {
        id: 'sch-001',
        name: 'Brookfield Academy',
        code: 'brookfield',
        status: 'active',
        address: { country: 'Ghana', city: 'Accra' },
        settings: { timezone: 'Africa/Accra' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
    },
    {
        id: 'sch-002',
        name: 'Maple Ridge School',
        code: 'maple-ridge',
        status: 'archived',
        address: { country: 'Canada' },
        settings: { timezone: 'America/Toronto' },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-02-01T00:00:00Z',
    },
];

describe('TenantSchoolsComponent', () => {
    let fixture: ComponentFixture<TenantSchoolsComponent>;
    let component: TenantSchoolsComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TenantSchoolsComponent],
            providers: [
                {
                    provide: ApiClient,
                    useValue: {
                        get: () => of(SCHOOLS),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(TenantSchoolsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('filters schools by search term', () => {
        component.handleSearch('brookfield');
        expect(component.filteredSchools().length).toBe(1);
        expect(component.filteredSchools()[0].name).toBe('Brookfield Academy');
    });

    it('toggles selection state from table selection', () => {
        const first = component.pagedSchools()[0];
        component.handleSelectionChange([first]);
        expect(component.selectedCount()).toBe(1);
        component.handleSelectionChange([]);
        expect(component.selectedCount()).toBe(0);
    });

    it('requires matching code before deleting a school', () => {
        const first = component.schools()[0];
        const initialCount = component.schools().length;

        component.openDeleteConfirm([first]);
        component.deleteConfirmInput.set('wrong');
        component.confirmDelete();
        expect(component.schools().length).toBe(initialCount);

        component.deleteConfirmInput.set(first.code);
        component.confirmDelete();
        expect(component.schools().length).toBe(initialCount - 1);
    });

    it('auto-generates the code from the school name', () => {
        component.openAddSchool();
        component.onSchoolNameChange('Bolgatanga Secondary School');
        expect(component.schoolFormCode()).toBe('bolgatanga-secondary-school');
    });

    it('validates code format rules', () => {
        component.openAddSchool();
        component.onSchoolCodeChange('bad--code');
        component.schoolFormCodeTouched.set(true);
        expect(component.schoolCodeError()).toBe('Avoid double hyphens.');
    });

    it('enables save only when required fields are valid', () => {
        component.openAddSchool();
        expect(component.canSaveSchool()).toBe(false);
        component.schoolFormName.set('New School');
        component.onSchoolCodeChange('new-school');
        component.schoolFormCountry.set('Ghana');
        component.schoolFormTimezone.set('Africa/Accra');
        expect(component.canSaveSchool()).toBe(true);
    });
});
