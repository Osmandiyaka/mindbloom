import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WorkflowBlockComponent } from '../../../../shared/components/workflow-block/workflow-block.component';

@Component({
  selector: 'app-dashboard-workflow',
  standalone: true,
  imports: [CommonModule, WorkflowBlockComponent],
  templateUrl: './dashboard-workflow.component.html',
  styleUrls: ['./dashboard-workflow.component.scss']
})
export class DashboardWorkflowComponent {
  constructor(private router: Router) {}

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
