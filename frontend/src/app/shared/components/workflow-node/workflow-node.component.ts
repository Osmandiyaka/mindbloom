import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-workflow-node',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './workflow-node.component.html',
    styleUrl: './workflow-node.component.scss'
})
export class WorkflowNodeComponent {
    @Input() title!: string;
    @Input() subtitle!: string;
    @Input() icon!: string;
    @Input() tone: 'primary' | 'secondary' = 'primary';
    @Output() select = new EventEmitter<void>();

    onClick() {
        this.select.emit();
    }
}
