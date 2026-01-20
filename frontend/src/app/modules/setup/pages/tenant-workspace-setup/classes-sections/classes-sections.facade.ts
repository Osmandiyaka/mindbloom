import { Injectable, computed, inject, signal } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { ClassResponse, SectionResponse } from '../../../../../core/services/class-section.service';
import { ClassesSectionsApiService } from './classes-sections-api.service';
import { ToastService } from '../../../../../core/ui/toast/toast.service';
import {
    ClassRow,
    FirstLoginSetupData,
    SectionRow,
} from '../tenant-workspace-setup.models';
import { SchoolContextService } from '../../../../../core/school/school-context.service';

@Injectable()
export class ClassesSectionsFacade {
    private readonly api: ClassesSectionsApiService = inject(ClassesSectionsApiService);
    private readonly toast: ToastService = inject(ToastService);
    private readonly schoolContext = inject(SchoolContextService);

    classRows = signal<ClassRow[]>([]);
    sectionRows = signal<SectionRow[]>([]);
    selectedClassId = signal<string | null>(null);
    classSearch = signal('');
    classSort = signal<'az' | 'recent' | 'sections'>('az');
    classSchoolFilter = signal<string>('all');
    classFormOpen = signal(false);
    classFormMode = signal<'add' | 'edit' | 'view'>('add');
    classMenuOpenId = signal<string | null>(null);
    classHeaderMenuOpen = signal(false);
    sectionsMenuOpen = signal(false);
    sectionMenuOpenId = signal<string | null>(null);
    classFormId = signal<string | null>(null);
    classFormName = signal('');
    classFormCode = signal('');
    classFormNotes = signal('');
    classFormSchoolIds = signal<string[]>([]);
    classFormError = signal('');
    classFormSubmitting = signal(false);
    sectionSearch = signal('');
    sectionFormOpen = signal(false);
    sectionFormMode = signal<'add' | 'edit' | 'view'>('add');
    sectionFormId = signal<string | null>(null);
    sectionFormClassId = signal<string | null>(null);
    sectionFormName = signal('');
    sectionFormCode = signal('');
    sectionFormCapacity = signal<string>('');
    sectionFormError = signal('');
    sectionFormSubmitting = signal(false);
    classDeleteOpen = signal(false);
    classDeleteTarget = signal<ClassRow | null>(null);
    classDeleteError = signal('');
    classDeleteSubmitting = signal(false);
    sectionDeleteOpen = signal(false);
    sectionDeleteTarget = signal<SectionRow | null>(null);
    sectionDeleteError = signal('');
    sectionDeleteSubmitting = signal(false);
    sectionGeneratorOpen = signal(false);
    sectionGeneratorPattern = signal<'letters' | 'numbers' | 'custom'>('letters');
    sectionGeneratorRange = signal('A-F');
    sectionGeneratorCapacity = signal('');
    sectionGeneratorCustom = signal('');
    sectionGeneratorError = signal('');
    classReorderOpen = signal(false);
    sectionReorderOpen = signal(false);
    classReorderDraft = signal<ClassRow[]>([]);
    sectionReorderDraft = signal<SectionRow[]>([]);
    classImportOpen = signal(false);
    classImportType = signal<'classes' | 'sections'>('classes');
    classImportFileName = signal('');
    classImportRows = signal<Array<Record<string, string>>>([]);
    classImportErrors = signal<string[]>([]);
    classImportSubmitting = signal(false);
    classesLoaded = signal(false);
    classesLoading = signal(false);

    private classCounter = 0;
    private sectionCounter = 0;

    readonly sortedClassRows = computed(() => [...this.classRows()].sort((a, b) => a.sortOrder - b.sortOrder));
    readonly filteredClassRows = computed(() => {
        const query = this.classSearch().trim().toLowerCase();
        const schoolFilter = this.classSchoolFilter();
        const rows = this.classRows().filter(row => {
            if (schoolFilter !== 'all') {
                if (!row.schoolIds.includes(schoolFilter)) {
                    return false;
                }
            }
            if (!query) return true;
            return row.name.toLowerCase().includes(query)
                || (row.code || '').toLowerCase().includes(query);
        });
        const sort = this.classSort();
        const sectionCounts = this.classSectionCountMap();
        return [...rows].sort((a, b) => {
            if (sort === 'recent') {
                return (b.sortOrder ?? 0) - (a.sortOrder ?? 0);
            }
            if (sort === 'sections') {
                const countA = sectionCounts.get(a.id) || 0;
                const countB = sectionCounts.get(b.id) || 0;
                if (countA !== countB) return countB - countA;
            }
            return a.name.localeCompare(b.name);
        });
    });
    readonly selectedClass = computed(() => {
        const id = this.selectedClassId();
        return id ? this.classRows().find(row => row.id === id) || null : null;
    });
    readonly classSectionCountMap = computed(() => {
        const counts = new Map<string, number>();
        this.sectionRows().forEach(section => {
            counts.set(section.classId, (counts.get(section.classId) || 0) + 1);
        });
        return counts;
    });
    readonly skeletonRows = Array.from({ length: 5 });
    readonly filteredSections = computed(() => {
        const selected = this.selectedClassId();
        if (!selected) return [];
        const query = this.sectionSearch().trim().toLowerCase();
        return this.sectionRows()
            .filter(section => section.classId === selected)
            .filter(section => {
                if (!query) return true;
                return section.name.toLowerCase().includes(query)
                    || (section.code || '').toLowerCase().includes(query);
            })
            .sort((a, b) => a.sortOrder - b.sortOrder);
    });
    readonly sectionCountForSelectedClass = computed(() => {
        const selected = this.selectedClassId();
        if (!selected) return 0;
        return this.sectionRows().filter(section => section.classId === selected).length;
    });
    readonly totalSectionCount = computed(() => this.sectionRows().length);
    readonly classSelectorOptions = computed(() => this.sortedClassRows()
        .map(row => ({
            id: row.id,
            name: row.name,
            code: row.code,
        })));

    applyState(data: FirstLoginSetupData): void {
        const migrated = this.migrateClasses(data.classes);
        if (migrated.classRows.length) {
            this.classRows.set(migrated.classRows);
        }
        if (migrated.isLegacy) {
            if (migrated.sectionRows.length) {
                this.sectionRows.set(migrated.sectionRows);
            }
        } else if (data.sections?.length) {
            this.sectionRows.set(data.sections);
        }
        this.syncClassCounter();
        this.syncSectionCounter();
        if (!this.selectedClassId() && this.classRows().length) {
            this.selectedClassId.set(this.classRows()[0].id);
        }
    }

    async loadFromApi(): Promise<void> {
        if (this.classesLoaded() || this.classesLoading()) return;
        if (this.classRows().length || this.sectionRows().length) {
            this.classesLoaded.set(true);
            return;
        }
        this.classesLoading.set(true);
        try {
            const classes = await firstValueFrom(this.api.listClasses());
            const classRows: ClassRow[] = classes.map((row, index) => ({
                id: row.id || row._id || this.nextClassId(),
                sortOrder: row.sortOrder ?? (index + 1),
                name: row.name,
                code: row.code ?? undefined,
                notes: row.notes ?? undefined,
                schoolIds: Array.isArray(row.schoolIds) ? row.schoolIds : [],
                status: row.status ?? 'active',
            }));
            this.classRows.set(classRows);
            if (!this.selectedClassId() && classRows.length) {
                this.selectedClassId.set(classRows[0].id);
            }
            const sectionLists = await Promise.all(classRows.map(async (row) => {
                try {
                    return await firstValueFrom(this.api.listSections(row.id));
                } catch {
                    return [];
                }
            }));
            const sections: SectionRow[] = sectionLists.flatMap(list => list.map((row, index) => ({
                id: row.id || row._id || this.nextSectionId(),
                sortOrder: row.sortOrder ?? (index + 1),
                classId: row.classId,
                name: row.name,
                code: row.code ?? undefined,
                capacity: row.capacity ?? null,
                status: row.status ?? 'active',
            })));
            if (sections.length) {
                this.sectionRows.set(sections);
            }
            this.syncClassCounter();
            this.syncSectionCounter();
            this.classesLoaded.set(true);
        } catch {
            this.toast.error('Unable to load classes. Please try again.');
        } finally {
            this.classesLoading.set(false);
        }
    }

    openAddClass(): void {
        this.classFormMode.set('add');
        this.classFormId.set(null);
        this.classFormName.set('');
        this.classFormCode.set('');
        this.classFormNotes.set('');
        this.classFormSchoolIds.set(this.defaultSchoolIds());
        this.classFormError.set('');
        this.classFormSubmitting.set(false);
        this.classFormOpen.set(true);
    }

    openEditClass(row: ClassRow): void {
        this.classFormMode.set('edit');
        this.classFormId.set(row.id);
        this.classFormName.set(row.name);
        this.classFormCode.set(row.code || '');
        this.classFormNotes.set(row.notes || '');
        this.classFormSchoolIds.set([...row.schoolIds]);
        this.classFormError.set('');
        this.classFormSubmitting.set(false);
        this.classFormOpen.set(true);
    }

    openViewClass(row: ClassRow): void {
        this.openEditClass(row);
        this.classFormMode.set('view');
    }

    toggleClassMenu(id: string, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.classMenuOpenId() === id ? null : id;
        this.closeClassMenus();
        this.classMenuOpenId.set(next);
    }

    closeClassMenu(): void {
        this.classMenuOpenId.set(null);
    }

    toggleClassHeaderMenu(event?: MouseEvent): void {
        event?.stopPropagation();
        const next = !this.classHeaderMenuOpen();
        this.closeClassMenus();
        this.classHeaderMenuOpen.set(next);
    }

    closeClassHeaderMenu(): void {
        this.classHeaderMenuOpen.set(false);
    }

    toggleSectionsMenu(event?: MouseEvent): void {
        event?.stopPropagation();
        const next = !this.sectionsMenuOpen();
        this.closeClassMenus();
        this.sectionsMenuOpen.set(next);
    }

    closeSectionsMenu(): void {
        this.sectionsMenuOpen.set(false);
    }

    toggleSectionMenu(id: string, event?: MouseEvent): void {
        event?.stopPropagation();
        const next = this.sectionMenuOpenId() === id ? null : id;
        this.closeClassMenus();
        this.sectionMenuOpenId.set(next);
    }

    closeSectionMenu(): void {
        this.sectionMenuOpenId.set(null);
    }

    requestCloseClassForm(): void {
        if (this.classFormMode() === 'view') {
            this.classFormOpen.set(false);
            return;
        }
        if (this.isClassFormDirty() && !window.confirm('Discard changes?')) {
            return;
        }
        this.classFormOpen.set(false);
        this.classFormError.set('');
    }

    async saveClassForm(hasMultipleSchools: boolean): Promise<void> {
        if (this.classFormSubmitting()) return;
        if (this.classFormMode() === 'view') {
            this.classFormOpen.set(false);
            return;
        }
        const name = this.classFormName().trim();
        if (!name) {
            this.classFormError.set('Class name is required.');
            return;
        }
        const code = this.classFormCode().trim();
        if (code && !/^[a-z0-9-]+$/i.test(code)) {
            this.classFormError.set('Class code must be alphanumeric and can include hyphens.');
            return;
        }
        const schoolIds = this.resolveClassSchoolIds(hasMultipleSchools);
        if (!schoolIds.length) {
            this.classFormError.set('Select at least one school.');
            return;
        }
        const payload = {
            name,
            code: code || undefined,
            schoolIds,
            notes: this.classFormNotes().trim() || undefined
        };

        try {
            this.classFormSubmitting.set(true);
            if (this.classFormMode() === 'edit' && this.classFormId()) {
                const id = this.classFormId()!;
                const saved = await firstValueFrom(this.api.updateClass(id, payload)) as ClassResponse;
                const savedId = saved.id || saved._id || id;
                const resolvedSchoolIds = saved.schoolIds ?? payload.schoolIds ?? [];
                this.classRows.update(items => items.map(row => row.id === savedId
                    ? {
                        ...row,
                        ...payload,
                        id: savedId,
                        sortOrder: row.sortOrder,
                        schoolIds: resolvedSchoolIds,
                    }
                    : row));
                this.toast.success(`Class "${name}" updated.`);
            } else {
                const saved = await firstValueFrom(this.api.createClass(payload)) as ClassResponse;
                const id = saved.id || saved._id || this.nextClassId();
                const sortOrder = saved.sortOrder ?? (this.classRows().length + 1);
                const newRow: ClassRow = {
                    id,
                    sortOrder,
                    name: saved.name || payload.name,
                    code: saved.code ?? payload.code,
                    schoolIds: saved.schoolIds ?? payload.schoolIds ?? [],
                    notes: saved.notes ?? payload.notes,
                    status: 'active',
                };
                this.classRows.update(items => [...items, newRow]);
                this.selectedClassId.set(id);
                this.toast.success(`Class "${name}" added.`);
            }
            this.classFormOpen.set(false);
        } catch (error: any) {
            const rawMessage = error?.error?.message;
            const message = Array.isArray(rawMessage)
                ? rawMessage.join(' ')
                : (rawMessage || 'Unable to save class. Please try again.');
            this.classFormError.set(message);
        } finally {
            this.classFormSubmitting.set(false);
        }
    }

    toggleClassSchoolSelection(id: string, checked: boolean): void {
        this.classFormSchoolIds.update(items => {
            if (checked) return items.includes(id) ? items : [...items, id];
            return items.filter(item => item !== id);
        });
    }

    openClassDelete(row: ClassRow): void {
        this.classDeleteTarget.set(row);
        this.classDeleteError.set('');
        this.classDeleteSubmitting.set(false);
        this.classDeleteOpen.set(true);
    }

    requestCloseClassDelete(): void {
        if (this.classDeleteSubmitting()) return;
        this.classDeleteOpen.set(false);
        this.classDeleteTarget.set(null);
        this.classDeleteError.set('');
    }

    async deleteClass(): Promise<void> {
        const target = this.classDeleteTarget();
        if (!target || this.classDeleteSubmitting()) return;
        this.classDeleteSubmitting.set(true);
        this.classDeleteError.set('');
        try {
            await firstValueFrom(this.api.deleteClass(target.id));
            this.sectionRows.update(items => items.filter(section => section.classId !== target.id));
            this.classRows.update(items => items.filter(row => row.id !== target.id));
            if (this.selectedClassId() === target.id) {
                const remaining = this.classRows();
                this.selectedClassId.set(remaining.length ? remaining[0].id : null);
            }
            this.toast.success(`Class "${target.name}" deleted.`);
            this.requestCloseClassDelete();
        } catch {
            this.classDeleteError.set('Unable to delete class. Please try again.');
        } finally {
            this.classDeleteSubmitting.set(false);
        }
    }

    async duplicateClass(row: ClassRow): Promise<void> {
        const sortOrder = this.classRows().length + 1;
        const name = `${row.name} copy`;
        try {
            const saved = await firstValueFrom(this.api.createClass({
                name,
                code: row.code,
                sortOrder,
                schoolIds: row.schoolIds,
                notes: row.notes
            })) as ClassResponse;
            const id = saved.id || saved._id || this.nextClassId();
            const newRow: ClassRow = {
                ...row,
                id,
                name,
                sortOrder,
                status: row.status,
            };
            this.classRows.update(items => [...items, newRow]);
            this.toast.success(`Class "${row.name}" duplicated.`);
        } catch {
            this.toast.error('Unable to duplicate class. Please try again.');
        }
    }

    setClassSort(value: string): void {
        if (value === 'az' || value === 'recent' || value === 'sections') {
            this.classSort.set(value);
        }
    }

    openAddSection(selectedClass?: ClassRow | null): void {
        const target = selectedClass || this.selectedClass();
        if (!target) {
            this.toast.warning('Select a class first.');
            return;
        }
        this.sectionFormMode.set('add');
        this.sectionFormId.set(null);
        this.sectionFormClassId.set(target.id);
        this.sectionFormName.set('');
        this.sectionFormCode.set('');
        this.sectionFormCapacity.set('');
        this.sectionFormError.set('');
        this.sectionFormOpen.set(true);
    }

    setSectionFormClassId(classId: string | null): void {
        this.sectionFormClassId.set(classId);
    }

    openEditSection(section: SectionRow): void {
        this.sectionFormMode.set('edit');
        this.sectionFormId.set(section.id);
        this.sectionFormClassId.set(section.classId);
        this.sectionFormName.set(section.name);
        this.sectionFormCode.set(section.code || '');
        this.sectionFormCapacity.set(section.capacity?.toString() || '');
        this.sectionFormError.set('');
        this.sectionFormOpen.set(true);
    }

    openViewSection(section: SectionRow): void {
        this.openEditSection(section);
        this.sectionFormMode.set('view');
    }

    requestCloseSectionForm(): void {
        if (this.sectionFormMode() === 'view') {
            this.sectionFormOpen.set(false);
            return;
        }
        if (this.isSectionFormDirty() && !window.confirm('Discard changes?')) {
            return;
        }
        this.sectionFormOpen.set(false);
        this.sectionFormError.set('');
    }

    async saveSectionForm(): Promise<void> {
        if (this.sectionFormSubmitting()) return;
        if (this.sectionFormMode() === 'view') {
            this.sectionFormOpen.set(false);
            return;
        }
        const classId = this.sectionFormClassId();
        if (!classId) {
            this.sectionFormError.set('Select a class.');
            return;
        }
        const name = this.sectionFormName().trim();
        if (!name) {
            this.sectionFormError.set('Section name is required.');
            return;
        }
        const code = this.sectionFormCode().trim();
        const capacityValue = this.sectionFormCapacity().trim();
        const capacityNumber = capacityValue ? Number(capacityValue) : null;
        if (capacityValue && (capacityNumber === null || !Number.isFinite(capacityNumber) || capacityNumber < 0)) {
            this.sectionFormError.set('Capacity must be a valid number.');
            return;
        }
        const payload = {
            classId,
            name,
            code: code || undefined,
            capacity: capacityValue ? capacityNumber : null
        };
        this.sectionFormSubmitting.set(true);
        this.sectionFormError.set('');
        try {
            if (this.sectionFormMode() === 'edit' && this.sectionFormId()) {
                const id = this.sectionFormId()!;
                const saved = await firstValueFrom(this.api.updateSection(id, payload)) as SectionResponse;
                const savedId = saved.id || saved._id || id;
                this.sectionRows.update(items => items.map(section => section.id === savedId
                    ? { ...section, ...payload, id: savedId }
                    : section));
                this.toast.success(`Section "${name}" updated.`);
            } else {
                const sortOrder = this.sectionRows().filter(section => section.classId === classId).length + 1;
                const saved = await firstValueFrom(this.api.createSection({
                    ...payload,
                    sortOrder
                })) as SectionResponse;
                const id = saved.id || saved._id || this.nextSectionId();
                const newSection: SectionRow = {
                    id,
                    sortOrder: saved.sortOrder ?? sortOrder,
                    classId: saved.classId || classId,
                    name: saved.name || name,
                    code: saved.code ?? payload.code,
                    capacity: saved.capacity ?? payload.capacity,
                    status: 'active',
                };
                this.sectionRows.update(items => [...items, newSection]);
                this.toast.success(`Section "${name}" added.`);
            }
            this.sectionFormOpen.set(false);
        } catch (error: any) {
            const rawMessage = error?.error?.message;
            const message = Array.isArray(rawMessage)
                ? rawMessage.join(' ')
                : (rawMessage || 'Unable to save section. Please try again.');
            this.sectionFormError.set(message);
        } finally {
            this.sectionFormSubmitting.set(false);
        }
    }

    openSectionDelete(section: SectionRow): void {
        this.sectionDeleteTarget.set(section);
        this.sectionDeleteError.set('');
        this.sectionDeleteSubmitting.set(false);
        this.sectionDeleteOpen.set(true);
    }

    requestCloseSectionDelete(): void {
        if (this.sectionDeleteSubmitting()) return;
        this.sectionDeleteOpen.set(false);
        this.sectionDeleteTarget.set(null);
        this.sectionDeleteError.set('');
    }

    async deleteSection(): Promise<void> {
        const target = this.sectionDeleteTarget();
        if (!target || this.sectionDeleteSubmitting()) return;
        this.sectionDeleteSubmitting.set(true);
        this.sectionDeleteError.set('');
        try {
            await firstValueFrom(this.api.deleteSection(target.id));
            this.sectionRows.update(items => items.filter(section => section.id !== target.id));
            this.toast.success(`Section "${target.name}" deleted.`);
            this.requestCloseSectionDelete();
        } catch {
            this.sectionDeleteError.set('Unable to delete section. Please try again.');
        } finally {
            this.sectionDeleteSubmitting.set(false);
        }
    }

    openSectionGenerator(): void {
        if (!this.selectedClass()) {
            this.toast.warning('Select a class first.');
            return;
        }
        this.sectionGeneratorPattern.set('letters');
        this.sectionGeneratorRange.set('A-F');
        this.sectionGeneratorCapacity.set('');
        this.sectionGeneratorCustom.set('');
        this.sectionGeneratorError.set('');
        this.sectionGeneratorOpen.set(true);
    }

    requestCloseSectionGenerator(): void {
        this.sectionGeneratorOpen.set(false);
        this.sectionGeneratorError.set('');
    }

    generateSectionsPreview(): string[] {
        const pattern = this.sectionGeneratorPattern();
        if (pattern === 'custom') {
            return this.sectionGeneratorCustom()
                .split(',')
                .map(item => item.trim())
                .filter(Boolean);
        }
        const range = this.sectionGeneratorRange().toUpperCase().trim();
        if (pattern === 'letters') {
            const [start, end] = range.split('-').map(value => value.trim());
            if (!start || !end) return [];
            const startCode = start.charCodeAt(0);
            const endCode = end.charCodeAt(0);
            if (Number.isNaN(startCode) || Number.isNaN(endCode) || startCode > endCode) return [];
            return Array.from({ length: endCode - startCode + 1 }, (_, i) => String.fromCharCode(startCode + i));
        }
        const [start, end] = range.split('-').map(value => value.trim());
        const startNum = Number(start);
        const endNum = Number(end);
        if (!Number.isFinite(startNum) || !Number.isFinite(endNum) || startNum > endNum) return [];
        return Array.from({ length: endNum - startNum + 1 }, (_, i) => `${startNum + i}`);
    }

    async createGeneratedSections(): Promise<void> {
        const classId = this.selectedClassId();
        if (!classId) {
            this.sectionGeneratorError.set('Select a class first.');
            return;
        }
        const preview = this.generateSectionsPreview();
        if (!preview.length) {
            this.sectionGeneratorError.set('Provide a valid section pattern.');
            return;
        }
        const capacityValue = this.sectionGeneratorCapacity().trim();
        const capacityNumber = capacityValue ? Number(capacityValue) : null;
        if (capacityValue && (capacityNumber === null || !Number.isFinite(capacityNumber) || capacityNumber < 0)) {
            this.sectionGeneratorError.set('Capacity must be a valid number.');
            return;
        }
        const existingNames = new Set(this.sectionRows()
            .filter(section => section.classId === classId)
            .map(section => section.name.toLowerCase()));
        const toCreate = preview.filter(name => !existingNames.has(name.toLowerCase()));
        const startIndex = this.sectionRows().filter(section => section.classId === classId).length;
        if (!toCreate.length) {
            this.sectionGeneratorError.set('All generated sections already exist.');
            return;
        }
        const newSections: SectionRow[] = [];
        try {
            for (const [index, name] of toCreate.entries()) {
                const sortOrder = startIndex + index + 1;
                const saved = await firstValueFrom(this.api.createSection({
                    classId,
                    name,
                    code: '',
                    capacity: capacityValue ? capacityNumber : null,
                    sortOrder
                })) as SectionResponse;
                const id = saved.id || saved._id || this.nextSectionId();
                newSections.push({
                    id,
                    classId: saved.classId || classId,
                    name: saved.name || name,
                    code: saved.code || '',
                    capacity: saved.capacity ?? (capacityValue ? capacityNumber : null),
                    status: 'active',
                    sortOrder: saved.sortOrder ?? sortOrder
                });
            }
            this.sectionRows.update(items => [...items, ...newSections]);
            this.toast.success(`Created ${newSections.length} sections.`);
            this.requestCloseSectionGenerator();
        } catch {
            this.sectionGeneratorError.set('Unable to create sections. Please try again.');
        }
    }

    selectClass(row: ClassRow): void {
        this.closeClassMenus();
        this.selectedClassId.set(row.id);
        this.sectionSearch.set('');
    }

    trackClassRow(_: number, row: ClassRow): string {
        return row.id;
    }

    trackSectionRow(_: number, row: SectionRow): string {
        return row.id;
    }

    objectKeys(row: Record<string, string>): string[] {
        return Object.keys(row);
    }

    openClassReorder(): void {
        this.classReorderDraft.set(this.sortedClassRows());
        this.classReorderOpen.set(true);
    }

    requestCloseClassReorder(): void {
        this.classReorderOpen.set(false);
        this.classReorderDraft.set([]);
    }

    handleClassReorderDrop(event: CdkDragDrop<ClassRow[]>): void {
        const draft = [...this.classReorderDraft()];
        moveItemInArray(draft, event.previousIndex, event.currentIndex);
        this.classReorderDraft.set(draft);
    }

    async saveClassReorder(): Promise<void> {
        const draft = this.classReorderDraft();
        if (!draft.length) {
            this.requestCloseClassReorder();
            return;
        }
        const orderMap = new Map(draft.map((row, index) => [row.id, index + 1]));
        try {
            await Promise.all(draft.map((row, index) =>
                firstValueFrom(this.api.updateClass(row.id, { sortOrder: index + 1 }))
            ));
            this.classRows.update(items => items.map(row => ({
                ...row,
                sortOrder: orderMap.get(row.id) ?? row.sortOrder
            })));
            this.toast.success('Class order updated.');
            this.requestCloseClassReorder();
        } catch {
            this.toast.error('Unable to update class order. Please try again.');
        }
    }

    openSectionReorder(): void {
        const selected = this.selectedClassId();
        if (!selected) return;
        this.sectionReorderDraft.set(this.filteredSections());
        this.sectionReorderOpen.set(true);
    }

    requestCloseSectionReorder(): void {
        this.sectionReorderOpen.set(false);
        this.sectionReorderDraft.set([]);
    }

    handleSectionReorderDrop(event: CdkDragDrop<SectionRow[]>): void {
        const draft = [...this.sectionReorderDraft()];
        moveItemInArray(draft, event.previousIndex, event.currentIndex);
        this.sectionReorderDraft.set(draft);
    }

    async saveSectionReorder(): Promise<void> {
        const draft = this.sectionReorderDraft();
        if (!draft.length) {
            this.requestCloseSectionReorder();
            return;
        }
        const orderMap = new Map(draft.map((row, index) => [row.id, index + 1]));
        try {
            await Promise.all(draft.map((row, index) =>
                firstValueFrom(this.api.updateSection(row.id, { sortOrder: index + 1 }))
            ));
            this.sectionRows.update(items => items.map(row => ({
                ...row,
                sortOrder: orderMap.get(row.id) ?? row.sortOrder
            })));
            this.toast.success('Section order updated.');
            this.requestCloseSectionReorder();
        } catch {
            this.toast.error('Unable to update section order. Please try again.');
        }
    }

    openImportModal(type: 'classes' | 'sections'): void {
        this.classImportType.set(type);
        this.classImportFileName.set('');
        this.classImportRows.set([]);
        this.classImportErrors.set([]);
        this.classImportSubmitting.set(false);
        this.classImportOpen.set(true);
    }

    requestCloseImportModal(): void {
        if (this.classImportSubmitting()) return;
        this.classImportOpen.set(false);
        this.classImportRows.set([]);
        this.classImportErrors.set([]);
    }

    handleImportFile(event: Event): void {
        const input = event.target as HTMLInputElement | null;
        if (!input?.files?.length) return;
        const file = input.files[0];
        this.classImportFileName.set(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result || '');
            const { rows, errors } = this.parseCsv(text);
            this.classImportRows.set(rows);
            this.classImportErrors.set(errors);
        };
        reader.readAsText(file);
    }

    confirmImport(): void {
        if (this.classImportSubmitting()) return;
        this.classImportSubmitting.set(true);
        const rows = this.classImportRows();
        if (!rows.length) {
            this.classImportErrors.set(['No rows found in file.']);
            this.classImportSubmitting.set(false);
            return;
        }
        const type = this.classImportType();
        if (type === 'classes') {
            const newRows: ClassRow[] = [];
            rows.forEach(row => {
            const name = (row['name'] || '').trim();
            if (!name) return;
            const code = (row['code'] || '').trim() || undefined;
            newRows.push({
                    id: this.nextClassId(),
                    name,
                    code,
                    sortOrder: this.classRows().length + newRows.length + 1,
                    schoolIds: this.defaultSchoolIds(),
                    status: 'active',
                });
            });
            if (newRows.length) {
                this.classRows.update(items => [...items, ...newRows]);
                this.toast.success(`Imported ${newRows.length} classes.`);
                this.requestCloseImportModal();
            } else {
                this.classImportErrors.set(['No valid classes found.']);
                this.classImportSubmitting.set(false);
            }
            return;
        }
        const classByCode = new Map(this.classRows().map(row => [row.code?.toLowerCase() || '', row]));
        const classByName = new Map(this.classRows().map(row => [row.name.toLowerCase(), row]));
        const sectionCounts = new Map<string, number>();
        this.sectionRows().forEach(section => {
            sectionCounts.set(section.classId, (sectionCounts.get(section.classId) || 0) + 1);
        });
        const newSections: SectionRow[] = [];
        rows.forEach(row => {
            const classCode = (row['classcode'] || row['classCode'] || '').trim().toLowerCase();
            const className = (row['classname'] || row['className'] || '').trim().toLowerCase();
            const classRow = classCode ? classByCode.get(classCode) : classByName.get(className);
            if (!classRow) return;
            const name = (row['sectionname'] || row['sectionName'] || '').trim();
            if (!name) return;
            const code = (row['sectioncode'] || row['sectionCode'] || '').trim() || undefined;
            const capacityValue = (row['capacity'] || '').trim();
            const capacityNumber = capacityValue ? Number(capacityValue) : null;
            if (capacityValue && (capacityNumber === null || !Number.isFinite(capacityNumber) || capacityNumber < 0)) return;
            const nextOrder = (sectionCounts.get(classRow.id) || 0) + 1;
            sectionCounts.set(classRow.id, nextOrder);
            newSections.push({
                id: this.nextSectionId(),
                classId: classRow.id,
                name,
                code,
                capacity: capacityValue ? capacityNumber : null,
                sortOrder: nextOrder,
                status: 'active',
            });
        });
        if (newSections.length) {
            this.sectionRows.update(items => [...items, ...newSections]);
            this.toast.success(`Imported ${newSections.length} sections.`);
            this.requestCloseImportModal();
        } else {
            this.classImportErrors.set(['No valid sections found.']);
            this.classImportSubmitting.set(false);
        }
    }

    downloadImportTemplate(type: 'classes' | 'sections'): void {
        const headers = type === 'classes'
            ? ['name', 'code']
            : ['classCode', 'className', 'sectionName', 'sectionCode', 'capacity'];
        this.downloadCsv(headers.join(',') + '\n', `${type}-template.csv`);
    }

    exportCsv(type: 'classes' | 'sections'): void {
        if (type === 'classes') {
            const rows = this.classRows().map(row => ([
                row.name,
                row.code || ''
            ].join(',')));
            this.downloadCsv(`name,code\n${rows.join('\n')}`, 'classes.csv');
            return;
        }
        const classById = new Map(this.classRows().map(row => [row.id, row]));
        const rows = this.sectionRows().map(section => ([
            classById.get(section.classId)?.code || '',
            classById.get(section.classId)?.name || '',
            section.name,
            section.code || '',
            section.capacity ?? ''
        ].join(',')));
        this.downloadCsv(`classCode,className,sectionName,sectionCode,capacity\n${rows.join('\n')}`, 'sections.csv');
    }

    private parseCsv(text: string): { rows: Array<Record<string, string>>; errors: string[] } {
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (!lines.length) {
            return { rows: [], errors: ['File is empty.'] };
        }
        const headers = lines[0].split(',').map(header => header.trim());
        const rows = lines.slice(1).map(line => {
            const values = line.split(',').map(value => value.trim());
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            return row;
        });
        return { rows, errors: [] };
    }

    private downloadCsv(text: string, filename: string): void {
        const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    private isClassFormDirty(): boolean {
        if (this.classFormMode() === 'add') {
            return !!this.classFormName().trim()
                || !!this.classFormCode().trim()
                || !!this.classFormNotes().trim()
                || this.classFormSchoolIds().length > 0;
        }
        const id = this.classFormId();
        const existing = this.classRows().find(row => row.id === id);
        if (!existing) return true;
        return existing.name !== this.classFormName().trim()
            || (existing.code || '') !== this.classFormCode().trim()
            || (existing.notes || '') !== this.classFormNotes().trim()
            || existing.schoolIds.join(',') !== this.classFormSchoolIds().join(',');
    }

    private isSectionFormDirty(): boolean {
        if (this.sectionFormMode() === 'add') {
            return !!this.sectionFormName().trim()
                || !!this.sectionFormCode().trim()
                || !!this.sectionFormCapacity().trim();
        }
        const id = this.sectionFormId();
        const existing = this.sectionRows().find(row => row.id === id);
        if (!existing) return true;
        return existing.classId !== this.sectionFormClassId()
            || existing.name !== this.sectionFormName().trim()
            || (existing.code || '') !== this.sectionFormCode().trim()
            || (existing.capacity?.toString() || '') !== this.sectionFormCapacity().trim();
    }

    private closeClassMenus(): void {
        this.classMenuOpenId.set(null);
        this.classHeaderMenuOpen.set(false);
        this.sectionsMenuOpen.set(false);
        this.sectionMenuOpenId.set(null);
    }

    private defaultSchoolIds(): string[] {
        return this.schoolContext.schools().map(school => school.id);
    }

    private resolveClassSchoolIds(hasMultipleSchools: boolean): string[] {
        const selected = this.classFormSchoolIds();
        if (selected.length) return [...selected];
        const defaults = this.defaultSchoolIds();
        if (!hasMultipleSchools && defaults.length) {
            return defaults;
        }
        return [];
    }

    private migrateClasses(data?: FirstLoginSetupData['classes']): {
        classRows: ClassRow[];
        sectionRows: SectionRow[];
        isLegacy: boolean;
    } {
        if (!data || !data.length) return { classRows: [], sectionRows: [], isLegacy: false };
        const first = data[0] as any;
        const isLegacy = typeof first.level === 'string' || typeof first.sections === 'string';
        if (!isLegacy) {
            return { classRows: data as ClassRow[], sectionRows: [], isLegacy: false };
        }
        const legacyRows = data as Array<{ name: string; level: string; sections: string }>;
        const classRows: ClassRow[] = [];
        const sectionRows: SectionRow[] = [];
        legacyRows.forEach((row, index) => {
            const classId = this.nextClassId();
            classRows.push({
                id: classId,
                name: row.name.trim(),
                code: '',
                sortOrder: index + 1,
                schoolIds: this.defaultSchoolIds(),
                status: 'active',
            });
            const sections = row.sections
                .split(',')
                .map(item => item.trim())
                .filter(Boolean);
            sections.forEach((sectionName, sectionIndex) => {
                sectionRows.push({
                    id: this.nextSectionId(),
                    classId,
                    name: sectionName,
                    code: '',
                    capacity: null,
                    status: 'active',
                    sortOrder: sectionIndex + 1
                });
            });
        });
        return { classRows, sectionRows, isLegacy: true };
    }

    private syncClassCounter(): void {
        const maxId = this.classRows().reduce((max, row) => {
            const match = /^class-(\d+)$/.exec(row.id);
            if (!match) return max;
            return Math.max(max, Number(match[1]));
        }, 0);
        this.classCounter = Math.max(this.classCounter, maxId);
    }

    private syncSectionCounter(): void {
        const maxId = this.sectionRows().reduce((max, row) => {
            const match = /^section-(\d+)$/.exec(row.id);
            if (!match) return max;
            return Math.max(max, Number(match[1]));
        }, 0);
        this.sectionCounter = Math.max(this.sectionCounter, maxId);
    }

    private nextClassId(): string {
        this.classCounter += 1;
        return `class-${this.classCounter}`;
    }

    private nextSectionId(): string {
        this.sectionCounter += 1;
        return `section-${this.sectionCounter}`;
    }

}
