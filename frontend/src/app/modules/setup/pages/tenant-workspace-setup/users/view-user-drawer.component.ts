import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MbButtonComponent } from '@mindbloom/ui';
import { ExistingUserRow } from './users.types';

@Component({
    selector: 'app-view-user-drawer',
    standalone: true,
    imports: [CommonModule, MbButtonComponent],
    templateUrl: './view-user-drawer.component.html',
    styleUrls: ['./users-setup.component.scss'],
})
export class ViewUserDrawerComponent {
    @Input() isOpen = false;
    @Input() user: ExistingUserRow | null = null;
    @Output() closed = new EventEmitter<void>();
    @Output() edit = new EventEmitter<ExistingUserRow>();
}
