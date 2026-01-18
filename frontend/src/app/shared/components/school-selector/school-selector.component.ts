import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MbCheckboxComponent, MbInputComponent } from '@mindbloom/ui';
export type SchoolOption = { id: string; name: string };

@Component({
    selector: 'app-school-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, MbCheckboxComponent, MbInputComponent],
    template: `
        <div class="school-selector" [class.school-selector--disabled]="disabled">
            <div class="school-selector__controls">
                <mb-input
                    class="school-selector__search"
                    [value]="search"
                    [placeholder]="searchPlaceholder"
                    [ariaLabel]="'Search schools'"
                    [disabled]="disabled"
                    (valueChange)="onSearchChange($event)">
                </mb-input>
                <div class="school-selector__actions">
                    <button type="button" class="school-selector__action"
                        (click)="selectAll()" [disabled]="disabled || !filteredSchools.length">
                        Select all
                    </button>
                    <button type="button" class="school-selector__action"
                        (click)="clearAll()" [disabled]="disabled || !selected.length">
                        Clear
                    </button>
                </div>
            </div>
            <div class="school-selector__meta">
                <div class="school-selector__count">{{ selected.length }} selected</div>
                <div class="school-selector__note">You can change access later.</div>
            </div>
                <div class="school-selector__chips" *ngIf="selected.length">
                    <span class="school-selector__chip" *ngFor="let name of selectedChips">{{ name }}</span>
                    <span class="school-selector__chip school-selector__chip--muted" *ngIf="overflowCount">
                        +{{ overflowCount }} more
                    </span>
                </div>
            <div class="school-selector__list" role="group" [attr.aria-label]="'Select schools'">
                <div class="school-selector__skeleton" *ngIf="isLoading">
                    <span class="school-selector__skeleton-row" *ngFor="let _ of skeletonRows"></span>
                </div>
                <ng-container *ngIf="!isLoading">
                    <mb-checkbox *ngFor="let school of filteredSchools; trackBy: trackSchool"
                        [checked]="selected.includes(school.id)"
                        [disabled]="disabled"
                        (checkedChange)="toggleSchool(school.id, $event)">
                        {{ school.name }}
                    </mb-checkbox>
                    <div class="school-selector__empty" *ngIf="!filteredSchools.length">
                        <div>No schools found.</div>
                        <button type="button" class="school-selector__empty-action" *ngIf="search"
                            (click)="clearSearch()" [disabled]="disabled">
                            Clear search
                        </button>
                    </div>
                </ng-container>
            </div>
        </div>
    `,
    styleUrls: ['./school-selector.component.scss']
})
export class SchoolSelectorComponent {
    @Input() schools: SchoolOption[] = [];
    @Input() selected: string[] = [];
    @Input() disabled = false;
    @Input() searchPlaceholder = 'Search schools...';
    @Output() selectedChange = new EventEmitter<string[]>();
    @Output() interaction = new EventEmitter<void>();

    search = '';
    isLoading = false;
    skeletonRows = Array.from({ length: 5 });

    get filteredSchools(): SchoolOption[] {
        const query = this.search.trim().toLowerCase();
        const source = this.schools;
        if (!query) return source;
        return source.filter(school => school.name.toLowerCase().includes(query));
    }

    get selectedChips(): string[] {
        const selectedSet = new Set(this.selected);
        const ordered = this.schools.filter(school => selectedSet.has(school.id));
        return ordered.map(school => school.name).slice(0, 2);
    }

    get overflowCount(): number {
        return Math.max(0, this.selected.length - 2);
    }

    onSearchChange(value: string): void {
        this.search = value;
        this.interaction.emit();
    }

    toggleSchool(schoolId: string, checked: boolean): void {
        const next = checked
            ? [...this.selected, schoolId]
            : this.selected.filter(item => item !== schoolId);
        this.selectedChange.emit([...new Set(next)]);
        this.interaction.emit();
    }

    selectAll(): void {
        const next = [...new Set([...this.selected, ...this.filteredSchools.map(school => school.id)])];
        this.selectedChange.emit(next);
        this.interaction.emit();
    }

    clearAll(): void {
        this.selectedChange.emit([]);
        this.interaction.emit();
    }

    clearSearch(): void {
        this.search = '';
        this.interaction.emit();
    }

    trackSchool = (_: number, school: SchoolOption) => school.id;
}
