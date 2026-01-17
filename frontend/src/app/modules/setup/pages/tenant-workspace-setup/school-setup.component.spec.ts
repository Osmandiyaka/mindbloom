import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TenantSchoolsComponent } from './school-setup.component';

describe('TenantSchoolsComponent', () => {
    let fixture: ComponentFixture<TenantSchoolsComponent>;
    let component: TenantSchoolsComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TenantSchoolsComponent],
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
});
