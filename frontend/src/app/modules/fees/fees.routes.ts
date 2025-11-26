import { Routes } from '@angular/router';

export const FEES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/fees-overview/fees-overview.component').then(m => m.FeesOverviewComponent)
    },
    {
        path: 'invoices',
        loadComponent: () => import('./pages/fees-invoices/fees-invoices.component').then(m => m.FeesInvoicesComponent)
    },
    {
        path: 'plans',
        loadComponent: () => import('./pages/fee-plans/fee-plans.component').then(m => m.FeePlansComponent)
    }
];
