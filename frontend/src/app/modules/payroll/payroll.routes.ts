import { Routes } from '@angular/router';

export const PAYROLL_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/payroll-overview/payroll-overview.component').then(m => m.PayrollOverviewComponent)
    }
];
