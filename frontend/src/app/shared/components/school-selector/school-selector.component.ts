import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MbCheckboxComponent, MbInputComponent } from '@mindbloom/ui';
import { ApiClient } from '../../../core/http/api-client.service';
import type { School } from '../../../core/school/school.models';

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
                    <mb-checkbox *ngFor="let name of filteredSchools"
                        [checked]="selected.includes(name)"
                        [disabled]="disabled"
                        (checkedChange)="toggleSchool(name, $event)">
                        {{ name }}
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
export class SchoolSelectorComponent implements OnInit {
    @Input() schools: string[] = [];
    @Input() selected: string[] = [];
    @Input() disabled = false;
    @Input() searchPlaceholder = 'Search schools...';
    @Output() selectedChange = new EventEmitter<string[]>();
    @Output() interaction = new EventEmitter<void>();

    private readonly api = inject(ApiClient);

    search = '';
    isLoading = false;
    skeletonRows = Array.from({ length: 5 });

    get filteredSchools(): string[] {
        const query = this.search.trim().toLowerCase();
        const source = this.schools;
        if (!query) return source;
        return source.filter(name => name.toLowerCase().includes(query));
    }

    get selectedChips(): string[] {
        const selectedSet = new Set(this.selected);
        const ordered = this.schools.filter(name => selectedSet.has(name));
        return ordered.slice(0, 2);
    }

    get overflowCount(): number {
        return Math.max(0, this.selected.length - 2);
    }

    onSearchChange(value: string): void {
        this.search = value;
        this.interaction.emit();
    }

    toggleSchool(name: string, checked: boolean): void {
        const next = checked
            ? [...this.selected, name]
            : this.selected.filter(item => item !== name);
        this.selectedChange.emit([...new Set(next)]);
        this.interaction.emit();
    }

    selectAll(): void {
        const next = [...new Set([...this.selected, ...this.filteredSchools])];
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

    ngOnInit(): void {
        this.isLoading = true;
        this.api.get<School[]>('schools').subscribe({
            next: (schools) => {
                const names = Array.isArray(schools)
                    ? schools.map(school => school.name).filter(Boolean)
                    : [];
                this.schools = names;
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            },
        });
    }
}
