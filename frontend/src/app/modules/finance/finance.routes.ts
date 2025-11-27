import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/finance-overview/finance-overview.component').then(m => m.FinanceOverviewComponent)
    },
    {
        path: 'budgets',
        loadComponent: () => import('./pages/budget-dashboard/budget-dashboard.component').then(m => m.BudgetDashboardComponent)
    },
    {
        path: 'approvals',
        loadComponent: () => import('./pages/approval-queue/approval-queue.component').then(m => m.ApprovalQueueComponent)
    },
    {
        path: 'expenses',
        loadComponent: () => import('./pages/expense-capture/expense-capture.component').then(m => m.ExpenseCaptureComponent)
    }
];
