import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { MbButtonComponent, MbPopoverComponent } from '@mindbloom/ui';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';
import { ModuleKey } from '../../../../shared/types/module-keys';

type QuickAction = {
  key: string;
  label: string;
  helper: string;
  icon: string;
  permission: string;
  moduleKey: ModuleKey;
  primary: boolean;
};

@Component({
  selector: 'app-student-quick-actions',
  standalone: true,
  imports: [CommonModule, OverlayModule, MbButtonComponent, MbPopoverComponent, TooltipDirective],
  templateUrl: './student-quick-actions.component.html',
  styleUrls: ['./student-quick-actions.component.scss'],
})
export class StudentQuickActionsComponent {
  @Input() hasStudent = false;
  @Input() studentName = '';
  @Input() menuOpen = false;
  @Input() primaryActions: QuickAction[] = [];
  @Input() secondaryActions: QuickAction[] = [];
  @Input() actionTooltip: (action: QuickAction) => string = () => '';
  @Input() isActionEnabled: (action: QuickAction) => boolean = () => true;

  @Output() toggleMenu = new EventEmitter<Event>();
  @Output() closeMenu = new EventEmitter<void>();
  @Output() runAction = new EventEmitter<QuickAction>();
}
