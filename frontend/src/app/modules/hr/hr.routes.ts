import { Routes } from '@angular/router';

export const HR_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/hr-overview/hr-overview.component').then(m => m.HrOverviewComponent)
    }
];
