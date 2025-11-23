import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-workflow-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workflow-block.component.html',
  styleUrls: ['./workflow-block.component.scss']
})
export class WorkflowBlockComponent {
  @Input() title!: string;
  @Input() subtitle!: string;
  @Input() icon!: string;
  @Output() select = new EventEmitter<void>();

  click() {
    this.select.emit();
  }
}
