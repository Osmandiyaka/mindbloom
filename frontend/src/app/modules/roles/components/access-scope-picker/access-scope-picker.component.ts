import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MbCheckboxComponent } from '@mindbloom/ui';

@Component({
    selector: 'app-access-scope-picker',
    standalone: true,
    imports: [CommonModule, MbCheckboxComponent],
    templateUrl: './access-scope-picker.component.html',
    styleUrls: ['./access-scope-picker.component.scss'],
})
export class AccessScopePickerComponent {
    @Input() scope: 'all' | 'selected' = 'all';
    @Input() schools: Array<{ id: string; name: string }> = [];
    @Input() selectedSchoolIds: string[] = [];
    @Input() disabled = false;

    @Output() scopeChange = new EventEmitter<'all' | 'selected'>();
    @Output() selectedSchoolIdsChange = new EventEmitter<string[]>();

    scopeName = `scope-${Math.random().toString(36).slice(2, 8)}`;

    selectScope(scope: 'all' | 'selected'): void {
        if (this.disabled) return;
        this.scope = scope;
        this.scopeChange.emit(scope);
    }

    toggleSchool(id: string): void {
        if (this.disabled) return;
        const next = new Set(this.selectedSchoolIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        const list = [...next];
        this.selectedSchoolIds = list;
        this.selectedSchoolIdsChange.emit(list);
    }

    isSelected(id: string): boolean {
        return this.selectedSchoolIds.includes(id);
    }
}
