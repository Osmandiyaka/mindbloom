import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { MbButtonComponent } from '@mindbloom/ui';
import { MbPopoverComponent } from '@mindbloom/ui';
import { StudentTimelineItem, TimelineFilter } from './student-timeline.model';
import { StudentTimelineItemComponent } from './student-timeline-item.component';

@Component({
    selector: 'app-student-timeline-card',
    standalone: true,
    imports: [CommonModule, OverlayModule, MbButtonComponent, MbPopoverComponent, StudentTimelineItemComponent],
    templateUrl: './student-timeline-card.component.html',
    styleUrls: ['./student-timeline-card.component.scss'],
})
export class StudentTimelineCardComponent {
    @Input() timelineItems: StudentTimelineItem[] = [];
    @Input() loading = false;
    @Input() error: string | null = null;
    @Input() hasStudent = false;
    @Input() activeFilter: TimelineFilter = 'all';
    @Input() hasMore = false;

    @Output() filterChange = new EventEmitter<TimelineFilter>();
    @Output() loadMore = new EventEmitter<void>();
    @Output() retry = new EventEmitter<void>();
    @Output() itemSelected = new EventEmitter<StudentTimelineItem>();
    @Output() itemAction = new EventEmitter<{ item: StudentTimelineItem; link: { label: string; route: string } }>();
    @Output() headerAction = new EventEmitter<'export' | 'filter'>();

    readonly filters: Array<{ label: string; value: TimelineFilter }> = [
        { label: 'All', value: 'all' },
        { label: 'Enrollment', value: 'enrollment' },
        { label: 'Documents', value: 'documents' },
        { label: 'Guardians', value: 'guardians' },
        { label: 'System', value: 'system' },
    ];

    readonly skeletonRows = Array.from({ length: 5 });

    readonly menuOpen = signal(false);

    get filteredItems() {
        if (this.activeFilter === 'all') {
            return this.timelineItems;
        }
        return this.timelineItems.filter((item) => item.category === this.activeFilter);
    }

    get menuOpenSignal() {
        return this.menuOpen();
    }

    setFilter(filter: TimelineFilter) {
        this.filterChange.emit(filter);
    }

    toggleMenu(event: MouseEvent) {
        event.stopPropagation();
        this.menuOpen.set(!this.menuOpen());
    }

    handleHeaderAction(action: 'export' | 'filter') {
        this.headerAction.emit(action);
        this.menuOpen.set(false);
    }

    onItemSelected(item: StudentTimelineItem) {
        this.itemSelected.emit(item);
    }

    onItemAction(event: { item: StudentTimelineItem; link: { label: string; route: string } }) {
        this.itemAction.emit(event);
    }

}
