import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClassSectionService, ClassResponse } from '../../../core/services/class-section.service';
import { MbClassSelectorComponent, MbClassSelectorOption, MbSelectComponent, MbSelectOption } from '@mindbloom/ui';

export type MbStatusOption = {
    value: string;
    label: string;
    hint?: string;
};

export type MbClassStatusSelection = {
    classId: string | null;
    sectionId: string | null;
    status: string | null;
    classLabel?: string;
    sectionLabel?: string;
    statusLabel?: string;
};

@Component({
    selector: 'mb-class-status-selector',
    standalone: true,
    imports: [CommonModule, MbClassSelectorComponent, MbSelectComponent],
    templateUrl: './class-status-selector.component.html',
    styleUrls: ['./class-status-selector.component.scss']
})
export class MbClassStatusSelectorComponent implements OnInit, OnChanges, OnDestroy {
    @Input() classId: string | null = null;
    @Input() sectionId: string | null = null;
    @Input() status: string | null = null;
    @Input() statusOptions: MbStatusOption[] = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
    ];
    @Input() disabled = false;
    @Input() allowClear = true;
    @Input() showSection = true;
    @Input() showStatus = true;
    @Input() title = 'Class & status';
    @Input() subtitle = 'Assign placement and lifecycle state.';
    @Input() classPlaceholder = 'Select class';
    @Input() sectionPlaceholder = 'Select section';
    @Input() statusPlaceholder = 'Select status';
    @Input() searchPlaceholder = 'Search classes...';
    @Input() emptyText = 'No classes found';

    @Output() classIdChange = new EventEmitter<string | null>();
    @Output() sectionIdChange = new EventEmitter<string | null>();
    @Output() statusChange = new EventEmitter<string | null>();
    @Output() selectionChange = new EventEmitter<MbClassStatusSelection>();

    classes: MbClassSelectorOption[] = [];
    sections: MbSelectOption[] = [];
    isLoadingClasses = false;
    isLoadingSections = false;

    private readonly subscriptions = new Subscription();
    private lastClassId: string | null = null;

    constructor(private readonly classSectionService: ClassSectionService) {}

    ngOnInit(): void {
        this.loadClasses();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['classId'] && !changes['classId'].firstChange) {
            const nextClassId = changes['classId'].currentValue as string | null;
            if (nextClassId !== this.lastClassId) {
                this.sectionId = null;
                this.sectionIdChange.emit(null);
                this.emitSelection();
                if (nextClassId && this.isKnownClassId(nextClassId)) {
                    this.loadSections(nextClassId);
                } else {
                    this.sections = [];
                }
            }
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    get statusSelectOptions(): MbSelectOption[] {
        return this.statusOptions.map(option => ({
            value: option.value,
            label: option.label
        }));
    }

    get sectionDisabled(): boolean {
        return this.disabled || !this.classId || this.isLoadingSections;
    }

    get statusDisabled(): boolean {
        return this.disabled || !this.showStatus;
    }

    get sectionHint(): string {
        if (this.sectionDisabled && !this.classId) {
            return 'Select a class to load sections.';
        }
        if (this.isLoadingSections) {
            return 'Loading sections...';
        }
        return '';
    }

    handleClassChange(value: string | null): void {
        this.classId = value;
        this.lastClassId = value;
        this.classIdChange.emit(value);
        this.sectionId = null;
        this.sectionIdChange.emit(null);
        if (value) {
            this.loadSections(value);
        } else {
            this.sections = [];
        }
        this.emitSelection();
    }

    handleSectionChange(value: string | null): void {
        this.sectionId = value;
        this.sectionIdChange.emit(value);
        this.emitSelection();
    }

    handleStatusChange(value: string | null): void {
        this.status = value;
        this.statusChange.emit(value);
        this.emitSelection();
    }

    private emitSelection(): void {
        const selectedClass = this.classes.find(option => option.id === (this.classId ?? ''));
        const selectedSection = this.sections.find(option => option.value === (this.sectionId ?? ''));
        const selectedStatus = this.statusOptions.find(option => option.value === (this.status ?? ''));
        this.selectionChange.emit({
            classId: this.classId ?? null,
            sectionId: this.sectionId ?? null,
            status: this.status ?? null,
            classLabel: selectedClass?.name,
            sectionLabel: selectedSection?.label,
            statusLabel: selectedStatus?.label
        });
    }

    private loadClasses(): void {
        this.isLoadingClasses = true;
        const sub = this.classSectionService.listClasses().subscribe({
            next: (items) => {
                this.classes = items.map(this.mapClassOption);
                this.isLoadingClasses = false;
                this.reconcileClassSelection();
            },
            error: () => {
                this.classes = [];
                this.isLoadingClasses = false;
            }
        });
        this.subscriptions.add(sub);
    }

    private loadSections(classId: string): void {
        this.isLoadingSections = true;
        const sub = this.classSectionService.listSections(classId).subscribe({
            next: (items) => {
                this.sections = items.map((section) => ({
                    value: section.id ?? section._id ?? '',
                    label: section.name
                }));
                this.isLoadingSections = false;
                this.reconcileSectionSelection();
            },
            error: () => {
                this.sections = [];
                this.isLoadingSections = false;
            }
        });
        this.subscriptions.add(sub);
    }

    private reconcileClassSelection(): void {
        const current = this.classId ?? '';
        if (!current || !this.classes.length) return;
        if (this.isKnownClassId(current)) {
            this.lastClassId = current;
            if (this.sectionId) {
                this.loadSections(current);
            }
            return;
        }
        const match = this.classes.find(option => option.name.toLowerCase() === current.toLowerCase());
        if (!match) return;
        this.classId = match.id;
        this.lastClassId = match.id;
        this.classIdChange.emit(match.id);
        this.loadSections(match.id);
        this.emitSelection();
    }

    private reconcileSectionSelection(): void {
        const current = this.sectionId ?? '';
        if (!current || !this.sections.length) return;
        const matchById = this.sections.find(option => option.value === current);
        if (matchById) return;
        const matchByLabel = this.sections.find(option => option.label.toLowerCase() === current.toLowerCase());
        if (!matchByLabel) return;
        this.sectionId = matchByLabel.value;
        this.sectionIdChange.emit(matchByLabel.value);
        this.emitSelection();
    }

    private isKnownClassId(value: string): boolean {
        return this.classes.some(option => option.id === value);
    }

    private mapClassOption(item: ClassResponse): MbClassSelectorOption {
        return {
            id: item.id ?? item._id ?? '',
            name: item.name,
            code: item.code,
            levelType: item.levelType
        };
    }
}
