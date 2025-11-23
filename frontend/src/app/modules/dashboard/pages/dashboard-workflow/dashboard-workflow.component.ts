import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WorkflowNodeComponent } from '../../../../shared/components/workflow-node/workflow-node.component';

interface WorkflowNode {
    id: string;
    section: string;
    title: string;
    subtitle: string;
    icon: string;
    x: number;
    y: number;
}

interface WorkflowEdge {
    from: string;
    to: string;
}

@Component({
    selector: 'app-dashboard-workflow',
    standalone: true,
    imports: [CommonModule, WorkflowNodeComponent],
    templateUrl: './dashboard-workflow.component.html',
    styleUrls: ['./dashboard-workflow.component.scss']
})
export class DashboardWorkflowComponent {
    readonly nodeWidth = 140;
    readonly nodeHeight = 55;

    nodes: WorkflowNode[] = [
        // === ADMISSIONS ===
        { id: 'inq', section: 'Admissions', title: 'Inquiries', subtitle: 'Manage inquiries', icon: 'mail', x: 60, y: 70 },
        { id: 'apps', section: 'Admissions', title: 'Applications', subtitle: 'Review applications', icon: 'doc', x: 230, y: 70 },
        { id: 'dec', section: 'Admissions', title: 'Review & Decision', subtitle: 'Admission decision', icon: 'tick', x: 400, y: 70 },

        // === FINANCE (top row) ===
        { id: 'fees', section: 'Finance', title: 'Fee Plans', subtitle: 'Setup fees', icon: 'tag', x: 580, y: 70 },
        { id: 'inv', section: 'Finance', title: 'Invoices', subtitle: 'Create invoices', icon: 'invoice', x: 750, y: 70 },
        { id: 'pay', section: 'Finance', title: 'Receive Payments', subtitle: 'Process payments', icon: 'card', x: 920, y: 70 },

        // === FINANCE (bottom row) ===
        { id: 'dep', section: 'Finance', title: 'Deposits', subtitle: 'Bank deposits', icon: 'bank', x: 750, y: 175 },

        // === ACADEMICS (top row) ===
        { id: 'catalog', section: 'Academics', title: 'Course Catalog', subtitle: 'Manage courses', icon: 'book', x: 60, y: 290 },
        { id: 'sects', section: 'Academics', title: 'Sections & Timetable', subtitle: 'Schedule classes', icon: 'calendar', x: 230, y: 290 },
        { id: 'grades', section: 'Academics', title: 'Enter Grades', subtitle: 'Grade students', icon: 'edit', x: 400, y: 290 },
        { id: 'reports', section: 'Academics', title: 'Report Cards', subtitle: 'Generate reports', icon: 'chart', x: 570, y: 290 },

        // === ACADEMICS (bottom row) ===
        { id: 'att', section: 'Academics', title: 'Attendance', subtitle: 'Take attendance', icon: 'clipboard', x: 400, y: 395 },

        // === HR/PAYROLL ===
        { id: 'emp', section: 'HR', title: 'Employees', subtitle: 'Manage staff', icon: 'people', x: 750, y: 290 },
        { id: 'time', section: 'HR', title: 'Enter Time', subtitle: 'Staff timesheets', icon: 'clock', x: 920, y: 290 },
        { id: 'payroll', section: 'HR', title: 'Pay Staff', subtitle: 'Process payroll', icon: 'money', x: 750, y: 395 },
    ];

    edges: WorkflowEdge[] = [
        // Admissions flow
        { from: 'inq', to: 'apps' },
        { from: 'apps', to: 'dec' },

        // Finance flow
        { from: 'fees', to: 'inv' },
        { from: 'inv', to: 'pay' },
        { from: 'pay', to: 'dep' },

        // Academics flow
        { from: 'catalog', to: 'sects' },
        { from: 'sects', to: 'grades' },
        { from: 'grades', to: 'reports' },
        { from: 'sects', to: 'att' },

        // HR flow
        { from: 'emp', to: 'time' },
        { from: 'time', to: 'payroll' },
    ];

    private nodeMap = new Map<string, WorkflowNode>();

    constructor(private router: Router) {
        this.nodes.forEach(n => this.nodeMap.set(n.id, n));
    }

    onNodeClick(node: WorkflowNode) {
        // Map node IDs to routes
        const routeMap: Record<string, string> = {
            'inq': '/students',
            'apps': '/students',
            'dec': '/students',
            'fees': '/fees',
            'inv': '/fees',
            'pay': '/fees',
            'dep': '/finance',
            'catalog': '/academics',
            'sects': '/academics',
            'grades': '/academics',
            'reports': '/academics',
            'att': '/attendance',
            'emp': '/hr',
            'time': '/hr',
            'payroll': '/payroll',
        };

        const route = routeMap[node.id];
        if (route) {
            this.router.navigate([route]);
        }
    }

    // Build orthogonal/curved path between nodes
    buildPath(edge: WorkflowEdge): string {
        const from = this.nodeMap.get(edge.from)!;
        const to = this.nodeMap.get(edge.to)!;

        // Connection points - from right edge of source, to left edge of target
        const x1 = from.x + this.nodeWidth;
        const y1 = from.y + this.nodeHeight / 2;
        const x2 = to.x;
        const y2 = to.y + this.nodeHeight / 2;

        // If nodes are on same row (horizontal connection)
        if (Math.abs(y1 - y2) < 20) {
            return `M ${x1} ${y1} L ${x2} ${y2}`;
        }

        // For vertical connections, create orthogonal path
        // Calculate midpoint for the vertical segment
        const midX = x1 + (x2 - x1) / 2;

        return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    }
}
