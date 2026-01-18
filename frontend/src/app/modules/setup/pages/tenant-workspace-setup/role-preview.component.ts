import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type RolePreviewItem = {
    title: string;
    description?: string;
};

@Component({
    selector: 'app-role-preview',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="role-preview">
            <div class="role-preview__header">
                <div class="role-preview__title">{{ role }}</div>
                <span class="role-preview__badge" *ngIf="badge">{{ badge }}</span>
            </div>
            <div class="role-preview__list">
                <div class="role-preview__item" *ngFor="let item of items">
                    <div class="role-preview__item-title">{{ item.title }}</div>
                    <div class="role-preview__item-desc" *ngIf="item.description">{{ item.description }}</div>
                </div>
            </div>
        </div>
    `,
    styleUrls: ['./role-preview.component.scss']
})
export class RolePreviewComponent {
    @Input() role = 'Staff';
    @Input() badge = '';
    @Input() items: RolePreviewItem[] = [];
}
