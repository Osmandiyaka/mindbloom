import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/finance-overview/finance-overview.component').then(m => m.FinanceOverviewComponent)
    }
];
