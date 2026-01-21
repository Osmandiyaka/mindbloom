import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { MbButtonComponent } from '@mindbloom/ui';
import { MbPopoverComponent } from '@mindbloom/ui';
import { StudentTimelineItem } from './student-timeline.model';

const ICON_MAP: Record<string, string> = {
    enrollment: '🎓',
    documents: '📄',
    guardians: '🧑‍🤝‍🧑',
    system: '⚙️',
    notes: '📝',
};

@Component({
    selector: 'app-student-timeline-item',
    standalone: true,
    imports: [CommonModule, OverlayModule, MbButtonComponent, MbPopoverComponent],
    templateUrl: './student-timeline-item.component.html',
    styleUrls: ['./student-timeline-item.component.scss'],
})
export class StudentTimelineItemComponent {
    @Input() item!: StudentTimelineItem;
    @Input() selectable = false;
    @Output() select = new EventEmitter<StudentTimelineItem>();
    @Output() action = new EventEmitter<{ item: StudentTimelineItem; link: { label: string; route: string } }>();

    readonly actionsOpen = signal(false);

    get icon() {
        return ICON_MAP[this.item.category] || '📌';
    }

    get metadataLabel() {
        if (!this.item.metadata) {
            return '';
        }
        return Object.entries(this.item.metadata)
            .map(([key, value]) => `${this.titleCase(key)}: ${value}`)
            .join(' · ');
    }

    get hasActions() {
        return !!this.item.links && this.item.links.length > 0;
    }

    formattedTime() {
        const value = new Date(this.item.occurredAt);
        const now = new Date();
        const diffMs = now.getTime() - value.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 24) {
            return diffHours <= 1 ? 'Just now' : `${diffHours}h ago`;
        }
        return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    toggleActions(event: MouseEvent) {
        event.stopPropagation();
        this.actionsOpen.set(!this.actionsOpen());
    }

    handleLink(link: { label: string; route: string }) {
        this.action.emit({ item: this.item, link });
        this.actionsOpen.set(false);
    }

    triggerSelect() {
        if (this.selectable) {
            this.select.emit(this.item);
        }
    }

    private titleCase(value: string) {
        return value
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    get actionsOpenSignal() {
        return this.actionsOpen();
    }
}
