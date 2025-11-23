import { Routes } from '@angular/router';

export const FEES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/fees-overview/fees-overview.component').then(m => m.FeesOverviewComponent)
    }
];
