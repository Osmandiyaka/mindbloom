import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

export interface MbNavItem {
    label: string;
    route?: string;
    icon?: string;
    badge?: string;
}

export interface MbNavSection {
    label: string;
    items: MbNavItem[];
    collapsed?: boolean;
}

@Component({
    selector: 'mb-nav',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <nav class="mb-nav" aria-label="Primary">
            <div class="mb-nav__section" *ngFor="let section of sections; let idx = index">
                <button type="button" class="mb-nav__section-toggle" (click)="toggleSection(idx)">
                    <span>{{ section.label }}</span>
                    <span class="mb-nav__chevron" [class.mb-nav__chevron--open]="!isCollapsed(idx)">▾</span>
                </button>
                <ul class="mb-nav__list" *ngIf="!isCollapsed(idx)">
                    <li *ngFor="let item of section.items">
                        <ng-container *ngIf="item.route; else staticItem">
                            <a class="mb-nav__link" [routerLink]="item.route">
                                <span class="mb-nav__icon" *ngIf="item.icon" aria-hidden="true">{{ item.icon }}</span>
                                <span>{{ item.label }}</span>
                                <span class="mb-nav__badge" *ngIf="item.badge">{{ item.badge }}</span>
                            </a>
                        </ng-container>
                        <ng-template #staticItem>
                            <div class="mb-nav__link">
                                <span class="mb-nav__icon" *ngIf="item.icon" aria-hidden="true">{{ item.icon }}</span>
                                <span>{{ item.label }}</span>
                                <span class="mb-nav__badge" *ngIf="item.badge">{{ item.badge }}</span>
                            </div>
                        </ng-template>
                    </li>
                </ul>
            </div>
        </nav>
    `,
    styleUrls: ['./mb-nav.component.scss']
})
export class MbNavComponent {
    @Input() sections: MbNavSection[] = [];

    private readonly collapsed = signal<Record<number, boolean>>({});

    toggleSection(index: number): void {
        const current = this.collapsed();
        this.collapsed.set({ ...current, [index]: !current[index] });
    }

    isCollapsed(index: number): boolean {
        return this.collapsed()[index] ?? this.sections[index]?.collapsed ?? false;
    }
}
