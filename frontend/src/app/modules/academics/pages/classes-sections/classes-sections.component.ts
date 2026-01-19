import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
    MbAlertComponent,
    MbButtonComponent,
    MbFormFieldComponent,
    MbInputComponent,
    MbModalComponent,
    MbModalFooterDirective,
    MbPopoverComponent,
    MbSchoolSelectorComponent,
    MbSelectComponent,
} from '@mindbloom/ui';
import { AcademicsStore } from '../../stores/academics.store';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { SectionsTableComponent } from './sections-table.component';
import { DestructiveConfirmModalComponent } from '../../../../shared/components/destructive-confirm-modal/destructive-confirm-modal.component';
import { CanDirective } from '../../../../shared/security/can.directive';
import { SchoolContextService } from '../../../../core/school/school-context.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { ClassDto, SectionDto } from '../../../../core/services/academics-api.service';

const DEFAULT_STATUS: 'active' | 'archived' = 'active';

type ClassFormState = {
    id?: string | null;
    name: string;
    code: string;
    gradeId: string | null;
    schoolIds: string[];
    academicYearId: string | null;
    status: 'active' | 'archived';
};

type SectionFormState = {
    id?: string | null;
    classId: string;
    name: string;
    code: string;
    schoolId: string;
    capacity: string;
    status: 'active' | 'archived';
};

@Component({
    selector: 'app-classes-sections',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MbAlertComponent,
        MbButtonComponent,
        MbFormFieldComponent,
        MbInputComponent,
        MbModalComponent,
        MbModalFooterDirective,
        MbPopoverComponent,
        MbSchoolSelectorComponent,
        MbSelectComponent,
        SearchInputComponent,
        SectionsTableComponent,
        DestructiveConfirmModalComponent,
        CanDirective,
    ],
    templateUrl: './classes-sections.component.html',
    styleUrls: ['./classes-sections.component.scss'],
    providers: [AcademicsStore],
})
export class ClassesSectionsComponent {
    readonly vm = inject(AcademicsStore);
    private readonly schoolContext = inject(SchoolContextService);
    private readonly tenantService = inject(TenantService);

    readonly classHeaderMenuOpen = signal(false);
    readonly sectionsHeaderMenuOpen = signal(false);

    readonly classModalOpen = signal(false);
    readonly classModalMode = signal<'add' | 'edit'>('add');
    readonly classForm = signal<ClassFormState>(this.emptyClassForm());
    readonly classFormError = signal<string | null>(null);
    readonly classFormSaving = signal(false);

    readonly sectionModalOpen = signal(false);
    readonly sectionModalMode = signal<'add' | 'edit'>('add');
    readonly sectionForm = signal<SectionFormState>(this.emptySectionForm());
    readonly sectionFormError = signal<string | null>(null);
    readonly sectionFormSaving = signal(false);

    readonly classArchiveOpen = signal(false);
    readonly classArchiveTarget = signal<ClassDto | null>(null);
    readonly classArchiveImpact = signal<{ sectionsCount?: number }>({});
    readonly classArchiveProcessing = signal(false);

    readonly sectionArchiveOpen = signal(false);
    readonly sectionArchiveTarget = signal<SectionDto | null>(null);
    readonly sectionArchiveProcessing = signal(false);
    readonly skeletonRows = Array.from({ length: 5 });

    readonly schools = computed(() => this.schoolContext.schools());
    readonly schoolNames = computed(() => new Map(this.schools().map(school => [school.id, school.name])));
    readonly hasMultipleSchools = computed(() => this.schools().length > 1);

    readonly gradeOptions = computed(() => this.vm.grades().map(grade => ({ id: grade.id, name: grade.name })));
    readonly gradeMap = computed(() => new Map(this.vm.grades().map(grade => [grade.id, grade.name])));

    readonly academicYearOptions = computed(() => {
        const tenant = this.tenantService.currentTenant();
        const academicYear = tenant?.academicYear;
        if (!academicYear) return [] as Array<{ id: string; name: string }>;
        const label = academicYear.name || this.formatAcademicYearRange(academicYear.start, academicYear.end);
        if (!label) return [] as Array<{ id: string; name: string }>;
        return [{ id: label, name: label }];
    });

    readonly showAcademicYearFilter = computed(() => this.vm.classConfig()?.classesScope === 'perAcademicYear');
    readonly gradeRequired = computed(() => !!this.vm.classConfig()?.requireGradeLink);

    readonly sectionsFiltered = computed(() => {
        const filters = this.vm.sectionsFilters();
        return Boolean(filters.search || filters.schoolId || (filters.status && filters.status !== DEFAULT_STATUS));
    });

    readonly classFiltersApplied = computed(() => {
        const filters = this.vm.filters();
        return Boolean(filters.schoolId || filters.gradeId || filters.academicYearId || (filters.status && filters.status !== DEFAULT_STATUS));
    });

    constructor() {
        this.vm.initFromRoute();
        this.vm.loadConfig();
        this.vm.loadGrades();
        this.vm.loadClasses();
    }

    trackClassRow = (_: number, row: ClassDto) => row.id;

    toggleClassHeaderMenu(event: Event): void {
        event.stopPropagation();
        this.classHeaderMenuOpen.set(!this.classHeaderMenuOpen());
    }

    closeClassHeaderMenu(): void {
        this.classHeaderMenuOpen.set(false);
    }

    toggleSectionsHeaderMenu(event: Event): void {
        event.stopPropagation();
        this.sectionsHeaderMenuOpen.set(!this.sectionsHeaderMenuOpen());
    }

    closeSectionsHeaderMenu(): void {
        this.sectionsHeaderMenuOpen.set(false);
    }

    updateClassSearch(term: string): void {
        this.vm.search.set(term);
        this.vm.loadClasses();
    }

    updateClassName(value: string): void {
        this.classForm.update(form => ({ ...form, name: value }));
    }

    updateClassCode(value: string): void {
        this.classForm.update(form => ({ ...form, code: value }));
    }

    updateClassGrade(value: string): void {
        this.classForm.update(form => ({ ...form, gradeId: value || null }));
    }

    updateClassSchools(schoolIds: string[]): void {
        this.classForm.update(form => ({ ...form, schoolIds }));
    }

    updateClassAcademicYear(value: string): void {
        this.classForm.update(form => ({ ...form, academicYearId: value || null }));
    }

    updateClassSchoolFilter(schoolId: string): void {
        this.vm.filters.update(filters => ({
            ...filters,
            schoolId: schoolId === 'all' ? undefined : schoolId,
        }));
        this.vm.loadGrades();
        this.vm.loadClasses();
    }

    updateClassGradeFilter(gradeId: string): void {
        this.vm.filters.update(filters => ({
            ...filters,
            gradeId: gradeId === 'all' ? undefined : gradeId,
        }));
        this.vm.loadClasses();
    }

    updateClassStatusFilter(status: string): void {
        this.vm.filters.update(filters => ({
            ...filters,
            status: status === 'all' ? undefined : (status as 'active' | 'archived'),
        }));
        this.vm.loadClasses();
    }

    updateClassAcademicYearFilter(value: string): void {
        this.vm.filters.update(filters => ({
            ...filters,
            academicYearId: value === 'all' ? undefined : value,
        }));
        this.vm.loadClasses();
    }

    selectClass(row: ClassDto): void {
        this.vm.selectClass(row.id);
    }

    toggleClassMenu(rowId: string, event: Event): void {
        event.stopPropagation();
        this.vm.menuOpenId.set(this.vm.menuOpenId() === rowId ? null : rowId);
    }

    closeClassMenu(): void {
        this.vm.menuOpenId.set(null);
    }

    openAddClass(): void {
        this.classModalMode.set('add');
        this.classForm.set(this.emptyClassForm());
        this.classFormError.set(null);
        this.classModalOpen.set(true);
    }

    openEditClass(row: ClassDto): void {
        this.classModalMode.set('edit');
        this.classForm.set({
            id: row.id,
            name: row.name,
            code: row.code ?? '',
            gradeId: row.gradeId ?? null,
            schoolIds: [...row.schoolIds],
            academicYearId: row.academicYearId ?? null,
            status: row.status,
        });
        this.classFormError.set(null);
        this.classModalOpen.set(true);
    }

    closeClassModal(): void {
        this.classModalOpen.set(false);
        this.classFormSaving.set(false);
        this.classFormError.set(null);
    }

    saveClass(): void {
        const form = this.classForm();
        if (!form.name.trim()) {
            this.classFormError.set('Class name is required.');
            return;
        }
        if (!form.schoolIds.length) {
            this.classFormError.set('Select at least one school.');
            return;
        }
        if (this.gradeRequired() && !form.gradeId) {
            this.classFormError.set('Select a grade level.');
            return;
        }
        if (this.showAcademicYearFilter() && !form.academicYearId) {
            this.classFormError.set('Select an academic year.');
            return;
        }

        this.classFormSaving.set(true);
        const payload = {
            name: form.name.trim(),
            code: form.code.trim() || null,
            schoolIds: form.schoolIds,
            academicYearId: form.academicYearId || null,
            gradeId: form.gradeId || null,
        };

        const onComplete = () => this.classFormSaving.set(false);
        if (this.classModalMode() === 'edit' && form.id) {
            this.vm.updateClass(form.id, payload, {
                onSuccess: () => this.closeClassModal(),
                onError: (error) => this.classFormError.set(error.message || 'Unable to update class.'),
                onComplete,
            });
        } else {
            this.vm.createClass(payload, {
                onSuccess: () => this.closeClassModal(),
                onError: (error) => this.classFormError.set(error.message || 'Unable to create class.'),
                onComplete,
            });
        }
    }

    openArchiveClass(row: ClassDto): void {
        this.classArchiveTarget.set(row);
        this.classArchiveImpact.set({});
        this.classArchiveProcessing.set(true);
        this.vm.getClassArchiveImpact(row.id, (impact) => {
            this.classArchiveImpact.set(impact);
            this.classArchiveProcessing.set(false);
            this.classArchiveOpen.set(true);
        }, () => {
            this.classArchiveProcessing.set(false);
            this.classArchiveOpen.set(true);
        });
    }

    confirmArchiveClass(confirmation: string): void {
        const target = this.classArchiveTarget();
        if (!target) return;
        this.classArchiveProcessing.set(true);
        this.vm.archiveClass(target.id, confirmation, () => {
            this.classArchiveProcessing.set(false);
            this.classArchiveOpen.set(false);
        }, () => {
            this.classArchiveProcessing.set(false);
        });
    }

    closeArchiveClass(): void {
        this.classArchiveOpen.set(false);
        this.classArchiveTarget.set(null);
        this.classArchiveProcessing.set(false);
    }

    restoreClass(row: ClassDto): void {
        this.vm.restoreClass(row.id);
    }

    openAddSection(): void {
        const selected = this.vm.selectedClass();
        if (!selected) return;
        this.sectionModalMode.set('add');
        this.sectionForm.set(this.emptySectionForm(selected));
        this.sectionFormError.set(null);
        this.sectionModalOpen.set(true);
    }

    openEditSection(row: SectionDto): void {
        this.sectionModalMode.set('edit');
        this.sectionForm.set({
            id: row.id,
            classId: row.classId,
            name: row.name,
            code: row.code ?? '',
            schoolId: row.schoolId,
            capacity: row.capacity != null ? String(row.capacity) : '',
            status: row.status,
        });
        this.sectionFormError.set(null);
        this.sectionModalOpen.set(true);
    }

    closeSectionModal(): void {
        this.sectionModalOpen.set(false);
        this.sectionFormSaving.set(false);
        this.sectionFormError.set(null);
    }

    saveSection(): void {
        const form = this.sectionForm();
        if (!form.name.trim()) {
            this.sectionFormError.set('Section name is required.');
            return;
        }
        if (!form.schoolId) {
            this.sectionFormError.set('Select a school for this section.');
            return;
        }

        this.sectionFormSaving.set(true);
        const payload = {
            classId: form.classId,
            name: form.name.trim(),
            schoolId: form.schoolId,
            code: form.code.trim() || null,
            capacity: this.parseCapacity(form.capacity),
        };

        const onComplete = () => this.sectionFormSaving.set(false);
        if (this.sectionModalMode() === 'edit' && form.id) {
            this.vm.updateSection(form.id, {
                name: payload.name,
                schoolId: payload.schoolId,
                code: payload.code,
                capacity: payload.capacity,
                status: form.status,
            }, {
                onSuccess: () => this.closeSectionModal(),
                onError: (error) => this.sectionFormError.set(error.message || 'Unable to update section.'),
                onComplete,
            });
        } else {
            this.vm.createSection(payload, {
                onSuccess: () => this.closeSectionModal(),
                onError: (error) => this.sectionFormError.set(error.message || 'Unable to create section.'),
                onComplete,
            });
        }
    }

    updateSectionSearch(term: string): void {
        this.vm.sectionsFilters.update(filters => ({
            ...filters,
            search: term || undefined,
        }));
        this.vm.loadSectionsForSelectedClass();
    }

    updateSectionName(value: string): void {
        this.sectionForm.update(form => ({ ...form, name: value }));
    }

    updateSectionCode(value: string): void {
        this.sectionForm.update(form => ({ ...form, code: value }));
    }

    updateSectionSchool(value: string): void {
        this.sectionForm.update(form => ({ ...form, schoolId: value }));
    }

    updateSectionCapacity(value: string): void {
        this.sectionForm.update(form => ({ ...form, capacity: value }));
    }

    updateSectionSchoolFilter(value: string): void {
        this.vm.sectionsFilters.update(filters => ({
            ...filters,
            schoolId: value === 'all' ? undefined : value,
        }));
        this.vm.loadSectionsForSelectedClass();
    }

    updateSectionStatusFilter(value: string): void {
        this.vm.sectionsFilters.update(filters => ({
            ...filters,
            status: value === 'all' ? undefined : (value as 'active' | 'archived'),
        }));
        this.vm.loadSectionsForSelectedClass();
    }

    handleSectionEmptyAction(action: string): void {
        if (action === 'addSection') {
            this.openAddSection();
            return;
        }
        if (action === 'clearFilters') {
            this.vm.sectionsFilters.set({ status: DEFAULT_STATUS });
            this.vm.loadSectionsForSelectedClass();
        }
    }

    openArchiveSection(row: SectionDto): void {
        this.sectionArchiveTarget.set(row);
        this.sectionArchiveOpen.set(true);
    }

    confirmArchiveSection(): void {
        const target = this.sectionArchiveTarget();
        if (!target) return;
        this.sectionArchiveProcessing.set(true);
        this.vm.archiveSection(target.id, undefined, () => {
            this.sectionArchiveProcessing.set(false);
            this.sectionArchiveOpen.set(false);
        }, () => {
            this.sectionArchiveProcessing.set(false);
        });
    }

    closeArchiveSection(): void {
        this.sectionArchiveOpen.set(false);
        this.sectionArchiveTarget.set(null);
        this.sectionArchiveProcessing.set(false);
    }

    restoreSection(row: SectionDto): void {
        this.vm.restoreSection(row.id);
    }

    classGradeLabel(row: ClassDto): string | null {
        if (!row.gradeId) return null;
        return this.gradeMap().get(row.gradeId) ?? null;
    }

    classSchoolLabel(row: ClassDto): string {
        const count = row.schoolIds?.length ?? 0;
        if (count <= 1) {
            const name = row.schoolIds?.[0] ? this.schoolNames().get(row.schoolIds[0]) : null;
            return name || 'Single school';
        }
        return `${count} schools`;
    }

    sectionSchoolOptions(): Array<{ id: string; name: string }> {
        const selected = this.vm.selectedClass();
        if (!selected?.schoolIds?.length) return [];
        const map = this.schoolNames();
        return selected.schoolIds.map(id => ({ id, name: map.get(id) || id }));
    }

    selectedClassMeta(): string {
        const selected = this.vm.selectedClass();
        if (!selected) return '';
        const meta: string[] = [];
        const grade = this.classGradeLabel(selected);
        if (grade) meta.push(grade);
        meta.push(this.classSchoolLabel(selected));
        meta.push(`${selected.sectionsCount ?? this.vm.sections().length} sections`);
        return meta.join(' | ');
    }

    private emptyClassForm(): ClassFormState {
        return {
            id: null,
            name: '',
            code: '',
            gradeId: null,
            schoolIds: this.defaultSchoolSelection(),
            academicYearId: this.defaultAcademicYearId(),
            status: DEFAULT_STATUS,
        };
    }

    private emptySectionForm(selected?: ClassDto | null): SectionFormState {
        const classEntity = selected ?? this.vm.selectedClass();
        const schoolId = classEntity?.schoolIds?.[0] ?? '';
        return {
            id: null,
            classId: classEntity?.id ?? '',
            name: '',
            code: '',
            schoolId,
            capacity: '',
            status: DEFAULT_STATUS,
        };
    }

    private defaultSchoolSelection(): string[] {
        const schools = this.schools();
        if (schools.length === 1) return [schools[0].id];
        const active = this.schoolContext.activeSchool();
        if (active?.id) return [active.id];
        return [];
    }

    private defaultAcademicYearId(): string | null {
        return this.academicYearOptions()[0]?.id ?? null;
    }

    private parseCapacity(value: string): number | null {
        const normalized = value.trim();
        if (!normalized) return null;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private formatAcademicYearRange(start?: string | Date, end?: string | Date): string | null {
        if (!start && !end) return null;
        const startYear = start ? new Date(start).getFullYear() : null;
        const endYear = end ? new Date(end).getFullYear() : null;
        if (startYear && endYear) return `${startYear}-${endYear}`;
        return startYear ? `${startYear}` : endYear ? `${endYear}` : null;
    }
}
